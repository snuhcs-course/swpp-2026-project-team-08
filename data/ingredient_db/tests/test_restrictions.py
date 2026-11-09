# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 제한 다수결과 응답 누락·중복 검증

import ast
import copy
import json
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.restrictions import (
    AGENTS,
    RESTRICTION_TYPES,
    build_prompt,
    majority,
    reconcile,
    response_schema,
    rows_from_wire,
    run,
    validate_ingredients,
    validate_response,
    validate_wire_response,
)


def ingredient_fixture():
    return [{"id": 1, "english_name": "Rice", "source_ids": [123]}]


def selected_fixture():
    selection_review = []
    for source_id, decision, name in [(123, "INCLUDE", "Rice"), (124, "EXCLUDE", "")]:
        record = {
            "source_id": source_id,
            "decision": decision,
            "votes": {
                agent: {
                    "source_id": source_id,
                    "decision": decision,
                    "english_name": name,
                    "reason": "Identified in source description.",
                }
                for agent in AGENTS
            },
        }
        if name:
            record["english_name"] = name
        selection_review.append(record)
    return {
        "ingredients": ingredient_fixture(),
        "sources": [
            {"source_id": 123, "description": "Rice, white"},
            {"source_id": 124, "description": "Pizza, cheese"},
        ],
        "metadata": {"archive_sha256": "fixture", "row_count": 2},
        "selection_review": selection_review,
        "grouping_review": [
            {
                "source_ids": [123],
                "method": "source_name",
                "votes": {
                    agent: {
                        "groups": [
                            {
                                "source_ids": [123],
                                "english_name": "Rice",
                                "reason": "Shared name in independent source decisions",
                            }
                        ],
                        "unresolved": [],
                    }
                    for agent in AGENTS
                },
            }
        ],
        "excluded": [{"source_id": 124, "reason": "Excluded by majority"}],
        "unresolved": [],
    }


def answer_fixture(degree="NEVER"):
    return {
        "rows": [
            {
                "ingredient_id": 1,
                "restriction_type": kind,
                "degree": degree,
                "reason": "Rice is a single grain, with no added ingredients in this source.",
            }
            for kind in RESTRICTION_TYPES
        ]
    }


def wire_fixture(degree="NEVER"):
    return {
        "rows": {
            "1": {
                row["restriction_type"]: {"degree": row["degree"], "reason": row["reason"]}
                for row in answer_fixture(degree)["rows"]
            }
        }
    }


class RestrictionTests(unittest.TestCase):
    def test_vocabulary_matches_server_without_importing_server_dependencies(self):
        root = Path(__file__).resolve().parents[3]
        tree = ast.parse((root / "server/app/models/restriction_enums.py").read_text())
        enum = next(
            node
            for node in tree.body
            if isinstance(node, ast.ClassDef) and node.name == "RestrictionType"
        )
        values = {
            node.value.value
            for node in enum.body
            if isinstance(node, ast.Assign)
            and isinstance(node.value, ast.Constant)
            and isinstance(node.value.value, str)
        }
        self.assertEqual(set(RESTRICTION_TYPES), values - {"ALLERGY.NONE"})
        self.assertEqual(len(RESTRICTION_TYPES), 19)

    def test_two_votes_win_even_against_stricter_third_vote(self):
        for votes, expected in [
            (["NEVER", "NEVER", "ALWAYS"], "NEVER"),
            (["UNKNOWN", "ALWAYS", "ALWAYS"], "ALWAYS"),
            (
                ["DEPENDS_ON_PRODUCT", "NEVER", "DEPENDS_ON_PRODUCT"],
                "DEPENDS_ON_PRODUCT",
            ),
            (["UNKNOWN", "NEVER", "UNKNOWN"], "UNKNOWN"),
            (["NEVER", "ALWAYS", "DEPENDS_ON_PRODUCT"], "UNKNOWN"),
        ]:
            with self.subTest(votes=votes):
                self.assertEqual(majority(votes), expected)

    def test_all_three_slots_are_required(self):
        for agents in [("a", "b"), ("a", "b", "c", "retry-a")]:
            with self.subTest(agents=agents), self.assertRaises(ValueError):
                reconcile(ingredient_fixture(), {agent: answer_fixture() for agent in agents})

    def test_unknown_is_valid_but_missing_pair_is_not(self):
        answer = answer_fixture("UNKNOWN")
        validate_response(ingredient_fixture(), answer)
        answer["rows"].pop()
        with self.assertRaisesRegex(ValueError, "missing"):
            validate_response(ingredient_fixture(), answer)

    def test_duplicate_pair_does_not_replace_missing_pair(self):
        answer = answer_fixture()
        answer["rows"][-1] = copy.deepcopy(answer["rows"][0])
        with self.assertRaisesRegex(ValueError, "duplicate"):
            validate_response(ingredient_fixture(), answer)

    def test_unknown_id_enum_or_blank_reason_is_rejected(self):
        for field, value in [
            ("ingredient_id", True),
            ("ingredient_id", 2),
            ("restriction_type", "ALLERGY.NONE"),
            ("degree", "SAFE"),
            ("reason", " "),
        ]:
            answer = answer_fixture()
            answer["rows"][0][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                validate_response(ingredient_fixture(), answer)

    def test_reconcile_preserves_each_agents_reason(self):
        responses = {agent: answer_fixture() for agent in AGENTS}
        for agent in AGENTS:
            responses[agent]["rows"][0]["reason"] = f"Reason from {agent}"
        responses["c"]["rows"][0]["degree"] = "ALWAYS"
        rows = reconcile(ingredient_fixture(), responses)
        peanut = next(row for row in rows if row["restriction_type"] == "ALLERGY.PEANUTS")
        self.assertEqual(peanut["degree"], "NEVER")
        self.assertEqual(peanut["votes"]["c"], {"degree": "ALWAYS", "reason": "Reason from c"})
        self.assertEqual(len(rows), 19)

    def test_canonical_groups_cannot_overlap_or_reuse_names(self):
        for second in [
            {"id": 2, "english_name": "Wheat", "source_ids": [123]},
            {"id": 2, "english_name": " rice ", "source_ids": [456]},
        ]:
            with self.subTest(second=second), self.assertRaises(ValueError):
                validate_ingredients(ingredient_fixture() + [second])

    def test_id_assignment_follows_names(self):
        with self.assertRaisesRegex(ValueError, "alphabetical"):
            validate_ingredients(
                [
                    {"id": 2, "english_name": "Rice", "source_ids": [123]},
                    {"id": 1, "english_name": "Wheat", "source_ids": [456]},
                ]
            )

    def test_prompt_contains_complete_source_description(self):
        prompt = build_prompt(
            ingredient_fixture(),
            {
                123: {
                    "source_id": 123,
                    "description": "Rice, white, cooked, no added salt",
                }
            },
        )
        self.assertIn("Rice, white, cooked, no added salt", prompt)
        self.assertIn("DIETARY_APPROACH.LACTOSE_FREE", prompt)

    def test_wire_schema_requires_all_exact_ids_and_restriction_keys(self):
        ingredients = [
            {"id": 190323, "english_name": "Rice", "source_ids": [123]},
            {"id": 190324, "english_name": "Wheat", "source_ids": [456]},
        ]
        schema = response_schema(ingredients)
        rows = schema["properties"]["rows"]
        self.assertEqual(rows["required"], ["190323", "190324"])
        self.assertEqual(set(rows["properties"]), {"190323", "190324"})
        self.assertFalse(rows["additionalProperties"])
        for ingredient in rows["properties"].values():
            self.assertEqual(set(ingredient["required"]), set(RESTRICTION_TYPES))
            self.assertEqual(set(ingredient["properties"]), set(RESTRICTION_TYPES))
            self.assertFalse(ingredient["additionalProperties"])
            for judgment in ingredient["properties"].values():
                self.assertEqual(set(judgment["required"]), {"degree", "reason"})
                self.assertFalse(judgment["additionalProperties"])

    def test_wire_conversion_preserves_decisions_and_has_deterministic_order(self):
        wire = wire_fixture("DEPENDS_ON_PRODUCT")
        response = rows_from_wire(ingredient_fixture(), wire)
        validate_response(ingredient_fixture(), response)
        self.assertEqual(len(response["rows"]), 19)
        self.assertEqual(
            [row["restriction_type"] for row in response["rows"]], sorted(RESTRICTION_TYPES)
        )
        self.assertTrue(all(row["degree"] == "DEPENDS_ON_PRODUCT" for row in response["rows"]))
        reversed_wire = {"rows": {"1": dict(reversed(list(wire["rows"]["1"].items())))}}
        self.assertEqual(rows_from_wire(ingredient_fixture(), reversed_wire), response)

    def test_wire_rejects_missing_extra_or_mistyped_ingredient_keys(self):
        for key in ("2", "01", 1):
            wire = wire_fixture()
            wire["rows"][key] = wire["rows"].pop("1")
            with self.subTest(key=key), self.assertRaises(ValueError):
                validate_wire_response(ingredient_fixture(), wire)
        for wire in ({"rows": {}}, {"rows": []}, answer_fixture()):
            with self.subTest(wire=wire), self.assertRaises(ValueError):
                validate_wire_response(ingredient_fixture(), wire)
        extra = wire_fixture()
        extra["rows"]["2"] = copy.deepcopy(extra["rows"]["1"])
        with self.assertRaises(ValueError):
            validate_wire_response(ingredient_fixture(), extra)

    def test_wire_rejects_missing_unknown_restriction_and_invalid_values(self):
        for mutation in ("missing", "unknown", "degree", "reason", "extra_value"):
            wire = wire_fixture()
            judgments = wire["rows"]["1"]
            if mutation == "missing":
                judgments.pop("ALLERGY.EGGS")
            elif mutation == "unknown":
                judgments["ALLERGY.NONE"] = judgments.pop("ALLERGY.EGGS")
            elif mutation == "extra_value":
                judgments["ALLERGY.EGGS"]["ingredient_id"] = 1
            else:
                judgments["ALLERGY.EGGS"][mutation] = "SAFE" if mutation == "degree" else " "
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                validate_wire_response(ingredient_fixture(), wire)

    def test_run_keeps_only_one_completed_response_per_slot(self):
        selected = selected_fixture()
        calls = []

        def fake_call(agent, task, prompt, schema, validate):
            calls.append((agent, task))
            # The runner retries a failed attempt in this slot; only its valid reply is returned.
            if agent == "a":
                invalid = wire_fixture()
                invalid["rows"]["1"].pop("ALLERGY.EGGS")
                with self.assertRaises(ValueError):
                    validate(invalid)
            answer = wire_fixture()
            validate(answer)
            return answer

        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "selected.json"
            path.write_text(json.dumps(selected))
            review = run(path, folder, call_agent=fake_call)
        self.assertEqual(len(calls), 3)
        self.assertEqual({agent for agent, _ in calls}, set(AGENTS))
        self.assertEqual(len(review["restriction_votes"]), 19)
        self.assertTrue(
            all(set(row["votes"]) == set(AGENTS) for row in review["restriction_votes"])
        )

    def test_invalid_third_response_prevents_completed_review(self):
        selected = selected_fixture()

        def fake_call(agent, task, prompt, schema, validate):
            return {"rows": {}} if agent == "c" else wire_fixture()

        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "selected.json"
            path.write_text(json.dumps(selected))
            with self.assertRaises(ValueError):
                run(path, folder, call_agent=fake_call)


if __name__ == "__main__":
    unittest.main()
