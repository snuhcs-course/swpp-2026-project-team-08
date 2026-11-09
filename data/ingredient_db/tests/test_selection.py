# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 재료 선정과 구성원 묶음의 다수결 검증

import copy
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.selection import (
    AGENTS,
    reconcile_groups,
    reconcile_rows,
    run,
    validate_groups,
    validate_selected,
    validate_selection,
)


def vote(source_id=1, decision="INCLUDE", name="Rice"):
    return {
        "source_id": source_id,
        "decision": decision,
        "english_name": name,
        "reason": "Source identifies rice",
    }


class SelectionTests(unittest.TestCase):
    def test_two_votes_accept_name_despite_third_exclusion(self):
        responses = {
            "a": [vote()],
            "b": [vote(name=" RICE ")],
            "c": [vote(decision="EXCLUDE", name="")],
        }
        included, excluded, unresolved, _, _ = reconcile_rows([{"source_id": 1}], responses)
        self.assertEqual([row["source_id"] for row in included], [1])
        self.assertEqual((excluded, unresolved), ([], []))

    def test_include_majority_does_not_choose_arbitrary_name(self):
        responses = {
            "a": [vote(name="Rice")],
            "b": [vote(name="White rice")],
            "c": [vote(decision="UNKNOWN", name="")],
        }
        included, _, unresolved, _, _ = reconcile_rows([{"source_id": 1}], responses)
        self.assertEqual(included, [])
        self.assertEqual(unresolved[0]["source_id"], 1)

    def test_unknown_majority_and_three_different_votes_stay_unresolved(self):
        for decisions in (("UNKNOWN", "UNKNOWN", "INCLUDE"), ("INCLUDE", "EXCLUDE", "UNKNOWN")):
            responses = {
                agent: [vote(decision=d, name="Rice" if d == "INCLUDE" else "")]
                for agent, d in zip(AGENTS, decisions, strict=True)
            }
            included, excluded, unresolved, _, _ = reconcile_rows([{"source_id": 1}], responses)
            self.assertEqual((included, excluded, len(unresolved)), ([], [], 1))

    def test_missing_agent_or_source_is_rejected(self):
        with self.assertRaises(ValueError):
            reconcile_rows([{"source_id": 1}], {"a": [vote()], "b": [vote()]})
        for rows in ([], [vote(), vote()], [vote(source_id=2)]):
            with self.assertRaises(ValueError):
                validate_selection({"rows": rows}, {1})

    def test_matching_name_without_matching_members_does_not_merge(self):
        first = {
            "groups": [{"source_ids": [1, 2], "english_name": "Rice", "reason": "same"}],
            "unresolved": [],
        }
        second = {
            "groups": [{"source_ids": [1], "english_name": "Rice", "reason": "single"}],
            "unresolved": [{"source_id": 2, "reason": "unclear"}],
        }
        third = {
            "groups": [],
            "unresolved": [{"source_id": i, "reason": "unclear"} for i in (1, 2)],
        }
        groups, pending = reconcile_groups({"a": first, "b": second, "c": third}, {1, 2})
        self.assertEqual(groups, [])
        self.assertEqual(len(pending), 2)

    def test_groups_cannot_overlap_or_omit_sources(self):
        for ids in ([1, 1], [1], [1, 3]):
            with self.assertRaises(ValueError):
                validate_groups(
                    {
                        "groups": [{"source_ids": ids, "english_name": "Rice", "reason": "same"}],
                        "unresolved": [],
                    },
                    {1, 2},
                )

    def test_cross_batch_sources_need_explicit_group_votes(self):
        calls = []
        source = {"metadata": {}, "rows": [{"source_id": 1}, {"source_id": 2}]}

        def fake(agent, task_id, prompt, schema, validate):
            calls.append((agent, task_id))
            if task_id.startswith("selection/"):
                source_id = int(task_id.rsplit("-", 1)[1])
                response = {"rows": [vote(source_id)]}
            else:
                response = {
                    "components": [
                        {
                            "component_id": 1,
                            "groups": [
                                {
                                    "source_ids": [1, 2],
                                    "english_name": "Rice",
                                    "reason": "Same grain",
                                }
                            ],
                            "unresolved": [],
                        }
                    ]
                }
            validate(response)
            return response

        with tempfile.TemporaryDirectory() as directory:
            selected = run(source, Path(directory), call_agent=fake, batch_size=1)
        self.assertEqual(
            selected["ingredients"], [{"id": 1, "english_name": "Rice", "source_ids": [1, 2]}]
        )
        self.assertEqual(sum(task.startswith("grouping/") for _, task in calls), 3)
        validate_selected(selected)
        tampered = copy.deepcopy(selected)
        tampered["grouping_review"][0]["method"] = "source_name"
        with self.assertRaises(ValueError):
            validate_selected(tampered)


if __name__ == "__main__":
    unittest.main()
