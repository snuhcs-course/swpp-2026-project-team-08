# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 전체 후보 Grouping과 선정 응답 보존 검증

import copy
import json
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db import families, selection


class FamilyTests(unittest.TestCase):
    def snapshot(self):
        rows = [
            {"source_id": 1, "description": "Pancakes, buckwheat, dry mix, incomplete"},
            {"source_id": 2, "description": "Pancakes, plain, dry mix, complete"},
            {"source_id": 3, "description": "Syrups, pancake"},
            {"source_id": 4, "description": "Baking soda"},
            {"source_id": 5, "description": "Pancakes, prepared from recipe"},
        ]

        def call(agent, task, prompt, schema, validate):
            names = ["Buckwheat pancake mix", "Plain pancake mix", f"Syrup {agent}", "Baking soda"]
            return {
                "rows": [
                    {
                        "i": str(row["source_id"]),
                        "d": "INCLUDE" if i < 4 else "EXCLUDE",
                        "n": names[i] if i < 4 else "",
                        "r": "Source identity",
                    }
                    for i, row in enumerate(rows)
                ]
            }

        with tempfile.TemporaryDirectory() as directory:
            return selection.run({"metadata": {}, "rows": rows}, Path(directory), call_agent=call)

    def test_all_candidates_get_three_votes_and_names_can_merge(self):
        snapshot = self.snapshot()
        original = copy.deepcopy(snapshot)
        calls = []

        def call(agent, task, prompt, schema, validate):
            self.assertTrue(task.startswith("grouping/"))
            components = json.loads(prompt.split("COMPONENTS_JSON:\n")[1])
            calls.append((agent, components))
            result = {"components": []}
            for component in components:
                ids = [r["source_id"] for r in component["sources"]]
                name = "Pancake mix" if 1 in ids else "Syrup" if 3 in ids else "Baking soda"
                result["components"].append(
                    {
                        "component_id": component["component_id"],
                        "groups": [
                            {"source_ids": ids, "english_name": name, "reason": "Same base"}
                        ],
                        "unresolved": [],
                    }
                )
            validate(result)
            return result

        with tempfile.TemporaryDirectory() as directory:
            result = selection.run(
                {"metadata": {}, "rows": snapshot["sources"]},
                Path(directory),
                call_agent=call,
                snapshot=snapshot,
            )
        self.assertEqual(snapshot, original)
        self.assertEqual(result["selection_review"], snapshot["selection_review"])
        self.assertEqual(len(calls), 3)
        self.assertEqual(
            {tuple(g["source_ids"]) for g in result["ingredients"]}, {(1, 2), (3,), (4,)}
        )
        self.assertEqual(result["excluded"], snapshot["excluded"])
        self.assertFalse(result["unresolved"])
        self.assertTrue(all(r["method"] == "group_review" for r in result["grouping_review"]))
        selection.validate_selected(result)
        result["grouping_review"][0]["method"] = "source_name"
        with self.assertRaises(ValueError):
            selection.validate_selected(result)

    def test_review_hold_does_not_become_candidate(self):
        snapshot = self.snapshot()
        review = snapshot["selection_review"]
        included, _, pending, _, _ = selection.reconcile_rows(
            snapshot["sources"],
            {agent: [row["votes"][agent] for row in review] for agent in selection.AGENTS},
        )
        actual, pending = families.candidates(
            included, pending, review, {"findings": [{"source_id": 3}]}
        )
        self.assertNotIn(3, {row["source_id"] for row in actual})
        self.assertIn(3, {row["source_id"] for row in pending})

    def test_large_family_is_never_split_between_requests(self):
        groups = [
            {"component_id": 1, "source_ids": list(range(500))},
            {"component_id": 2, "source_ids": [501]},
            {"component_id": 3, "source_ids": [502]},
        ]
        batches = list(families.batches(groups))
        self.assertEqual(batches, [[groups[0]], groups[1:]])

    def test_regroup_resume_keeps_successful_agent_slots(self):
        from collections import Counter

        from data.ingredient_db.runner import AgentRunner

        snapshot = self.snapshot()
        calls = Counter()
        fail = True
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)

            def call(agent, task, prompt, schema, validate):
                def request(*args, **kwargs):
                    calls[agent] += 1
                    if fail and agent == "b":
                        raise RuntimeError("Injected grouping failure")
                    components = json.loads(prompt.split("COMPONENTS_JSON:\n")[1])
                    return {
                        "components": [
                            {
                                "component_id": c["component_id"],
                                "groups": [
                                    {
                                        "source_ids": [r["source_id"] for r in c["sources"]],
                                        "english_name": f"Ingredient {c['component_id']}",
                                        "reason": "Base",
                                    }
                                ],
                                "unresolved": [],
                            }
                            for c in components
                        ]
                    }

                runner = AgentRunner(
                    work, policy_text="new policy", source_hash="hash", request=request
                )
                return runner.call(agent, task, prompt, schema, validate)

            source = {"metadata": {}, "rows": snapshot["sources"]}
            with self.assertRaisesRegex(RuntimeError, "Injected grouping failure"):
                selection.run(source, work, call_agent=call, snapshot=snapshot)
            self.assertFalse((work / "selected.json").exists())
            fail = False
            selected = selection.run(source, work, call_agent=call, snapshot=snapshot)
            selection.validate_selected(selected)
            self.assertEqual(calls, {"a": 1, "b": 2, "c": 1})

    def test_failed_small_batch_switches_transport(self):
        from unittest.mock import patch

        snapshot = self.snapshot()
        called = []

        def fallback(agent, task, prompt, schema, validate, **kwargs):
            called.append(agent)
            return {
                "components": [
                    {
                        "component_id": c["component_id"],
                        "groups": [
                            {
                                "source_ids": [r["source_id"] for r in c["sources"]],
                                "english_name": f"Ingredient {c['component_id']}",
                                "reason": "Base",
                            }
                        ],
                        "unresolved": [],
                    }
                    for c in kwargs["components"]
                ]
            }

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            failure = work / "invalid/grouping/a/batch-0001-attempt-3.json"
            failure.parent.mkdir(parents=True)
            failure.write_text("{}")
            with patch("data.ingredient_db.large_groups.call", side_effect=fallback):
                result = selection.run(
                    {"metadata": {}, "rows": snapshot["sources"]},
                    work,
                    call_agent=lambda *args: self.fail("old request repeated"),
                    snapshot=snapshot,
                )
        self.assertEqual(set(called), set(selection.AGENTS))
        selection.validate_selected(result)
