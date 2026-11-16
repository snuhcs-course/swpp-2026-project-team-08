# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 재료 선정과 구성원 묶음의 다수결 검증

import copy
import json
import tempfile
import threading
import unittest
from collections import Counter
from pathlib import Path

from data.ingredient_db.runner import AgentRunner
from data.ingredient_db.selection import (
    AGENTS,
    build_grouping_prompt,
    build_prompt,
    decode_selection,
    is_english_name,
    reconcile_groups,
    reconcile_rows,
    run,
    selection_schema,
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
    def test_out_of_order_batches_keep_three_requests_busy_and_same_result(self):
        source = {"metadata": {}, "rows": [{"source_id": index} for index in range(1, 4)]}
        second_batch_finished = threading.Event()
        lock = threading.Lock()
        running, peak, completions = 0, 0, []

        def response(schema):
            return {
                "rows": {
                    source_id: {
                        "decision": "INCLUDE",
                        "english_name": f"Ingredient {source_id}",
                        "reason": "Distinct ingredient",
                    }
                    for source_id in schema["properties"]["rows"]["items"]["properties"]["i"][
                        "enum"
                    ]
                }
            }

        def delayed(agent, task_id, prompt, schema, validate):
            nonlocal running, peak
            slot = (task_id, agent)
            with lock:
                running += 1
                peak = max(peak, running)
            try:
                if slot == ("selection/batch-0001", "a"):
                    self.assertTrue(second_batch_finished.wait(5), "later batches were blocked")
                payload = response(schema)
                validate(payload)
                with lock:
                    completions.append(slot)
                if task_id == "selection/batch-0002":
                    second_batch_finished.set()
                return payload
            finally:
                with lock:
                    running -= 1

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            actual = run(source, work / "delayed", call_agent=delayed, batch_size=1)
            expected = run(
                source,
                work / "immediate",
                call_agent=lambda agent, task, prompt, schema, validate: response(schema),
                batch_size=1,
            )
        self.assertEqual(actual, expected)
        self.assertLessEqual(peak, 3)
        self.assertLess(
            min(i for i, slot in enumerate(completions) if slot[0] == "selection/batch-0002"),
            completions.index(("selection/batch-0001", "a")),
        )

    def test_failed_parallel_run_reuses_completed_slots_on_resume(self):
        source = {"metadata": {}, "rows": [{"source_id": index} for index in range(1, 7)]}
        calls = Counter()
        lock = threading.Lock()
        fail = True

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)

            def call_agent(agent, task_id, prompt, schema, validate):
                def request(*args, **kwargs):
                    with lock:
                        calls[(agent, task_id)] += 1
                    if fail and (agent, task_id) == ("b", "selection/batch-0001"):
                        raise RuntimeError("Injected failure")
                    return {
                        "rows": {
                            source_id: {
                                "decision": "INCLUDE",
                                "english_name": f"Ingredient {source_id}",
                                "reason": "Distinct ingredient",
                            }
                            for source_id in schema["properties"]["rows"]["items"]["properties"][
                                "i"
                            ]["enum"]
                        }
                    }

                runner = AgentRunner(
                    work, policy_text="policy", source_hash="hash", request=request
                )
                return runner.call(agent, task_id, prompt, schema, validate)

            with self.assertRaisesRegex(RuntimeError, "Injected failure"):
                run(source, work, call_agent=call_agent, batch_size=1)
            self.assertFalse((work / "selected.json").exists())
            before = calls.copy()
            self.assertLess(len(before), len(source["rows"]) * len(AGENTS))
            fail = False
            selected = run(source, work, call_agent=call_agent, batch_size=1)
            self.assertEqual(len(selected["ingredients"]), 6)
            for slot, count in before.items():
                expected = count + 1 if slot == ("b", "selection/batch-0001") else count
                self.assertEqual(calls[slot], expected)
            self.assertEqual(sum(calls.values()), len(source["rows"]) * len(AGENTS) + 1)

    def test_partial_batches_do_not_submit_the_remaining_sources(self):
        calls = []

        def fake(agent, task, prompt, schema, validate):
            calls.append((agent, task))
            return {
                "rows": {
                    source_id: {"decision": "EXCLUDE", "english_name": "", "reason": "Meal"}
                    for source_id in schema["properties"]["rows"]["items"]["properties"]["i"][
                        "enum"
                    ]
                }
            }

        source = {"metadata": {}, "rows": [{"source_id": 1}, {"source_id": 2}]}
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            self.assertIsNone(run(source, work, call_agent=fake, batch_size=1, max_batches=1))
            self.assertFalse((work / "selected.json").exists())
        self.assertEqual(set(calls), {(agent, "selection/batch-0001") for agent in AGENTS})

    def test_names_require_latin_letters_and_reject_controls(self):
        for name in ("쌀", "Рис", "Rice\n", "Rice\u200b", "123", "-"):
            with self.subTest(name=repr(name)):
                self.assertFalse(is_english_name(name))
                with self.assertRaises(ValueError):
                    validate_selection({"rows": [vote(name=name)]}, {1})
                with self.assertRaises(ValueError):
                    validate_groups(
                        {
                            "groups": [
                                {"source_ids": [1], "english_name": name, "reason": "Ingredient"}
                            ],
                            "unresolved": [],
                        },
                        {1},
                    )
        self.assertTrue(is_english_name("Jalapeño peppers (dried)"))
        self.assertTrue(is_english_name("Milk, 2% fat"))
        validate_selection({"rows": [vote(name="Jalapeño peppers")]}, {1})

    def test_source_descriptions_survive_selection_and_grouping_requests(self):
        rows = [
            {
                "source_id": 1,
                "description": "Cheese, cottage, lactose-reduced",
                "category": "Dairy and Egg Products",
            },
            {
                "source_id": 2,
                "description": "Salad dressing, creamy, reduced fat",
                "category": "Fats and Oils",
            },
            {
                "source_id": 3,
                "description": "Cereals, QUAKER, oat bran, dry",
                "category": "Breakfast Cereals",
            },
        ]
        self.assertEqual(json.loads(build_prompt(rows).split("SOURCE_ROWS_JSON:\n")[1]), rows)
        components = [{"component_id": 1, "sources": rows[:1]}]
        self.assertEqual(
            json.loads(build_grouping_prompt(components).split("COMPONENTS_JSON:\n")[1]), components
        )

    def test_composition_split_majority_is_not_overwritten_by_base_name_merge(self):
        split = {
            "groups": [
                {"source_ids": [1], "english_name": "Cottage cheese", "reason": "Ordinary dairy"},
                {
                    "source_ids": [2],
                    "english_name": "Lactose-reduced cottage cheese",
                    "reason": "Source explicitly reduces lactose",
                },
            ],
            "unresolved": [],
        }
        merged = {
            "groups": [
                {"source_ids": [1, 2], "english_name": "Cottage cheese", "reason": "Same base name"}
            ],
            "unresolved": [],
        }
        groups, unresolved = reconcile_groups({"a": split, "b": split, "c": merged}, {1, 2})
        self.assertEqual(
            groups,
            [
                {"source_ids": [1], "english_name": "Cottage cheese"},
                {"source_ids": [2], "english_name": "Lactose-reduced cottage cheese"},
            ],
        )
        self.assertEqual(unresolved, [])

    def test_api_schema_limits_compact_ids_and_decoder_checks_complete_coverage(self):
        schema = selection_schema({172223, 172222})["properties"]["rows"]
        self.assertEqual(schema["items"]["properties"]["i"]["enum"], ["172222", "172223"])
        self.assertEqual(schema["items"]["required"], ["i", "d", "n", "r"])
        self.assertFalse(schema["items"]["additionalProperties"])
        compact = {"i": "172223", "d": "INCLUDE", "n": "Cheese", "r": "Dairy"}
        self.assertEqual(decode_selection({"rows": [compact]}, {172223})[0]["source_id"], 172223)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            decode_selection({"rows": [compact, compact]}, {172223})
        value = {"decision": "INCLUDE", "english_name": "Cheese", "reason": "Dairy ingredient"}
        decoded = decode_selection({"rows": {"172223": value}}, {172223})
        self.assertEqual(decoded, [{"source_id": 172223, **value}])
        for wrong in ({"172233": value}, {}, {"172223": value, "172233": value}):
            with self.assertRaises(ValueError):
                decode_selection({"rows": wrong}, {172223})

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
                response = {
                    "rows": {
                        str(source_id): {
                            key: value
                            for key, value in vote(source_id).items()
                            if key != "source_id"
                        }
                    }
                }
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
