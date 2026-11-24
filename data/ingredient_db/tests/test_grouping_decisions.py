# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 묶음 수정의 원본 보존과 검토 결과 재현 검증

import copy
import unittest

from data.ingredient_db.export import render
from data.ingredient_db.grouping_decisions import apply_decisions
from data.ingredient_db.runner import digest
from data.ingredient_db.selection import validate_selected
from data.ingredient_db.tests.test_export import review_fixture


class GroupingDecisionsTests(unittest.TestCase):
    def fixture(self):
        items = [{"id": 1, "english_name": "Grits", "source_ids": [1, 2]}]
        decisions = {
            "ingredients_sha256": digest(items),
            "policy_sha256": "test",
            "authorization": "User delegates corrections",
            "reviewer": "Reviewer",
            "scope": "Composition distinctions",
            "edits": [
                {
                    "before": copy.deepcopy(items[0]),
                    "reason": "Salt differs",
                    "after": [
                        {"english_name": "Grits, without salt", "source_ids": [1]},
                        {"english_name": "Grits, with salt", "source_ids": [2]},
                    ],
                }
            ],
        }
        return items, decisions

    def test_split_preserves_sources_and_sorts_ids(self):
        items, decisions = self.fixture()
        original = copy.deepcopy(items)
        result = apply_decisions(items, decisions, "test")
        self.assertEqual([r["id"] for r in result], [1, 2])
        self.assertEqual(result[0]["source_ids"], [2])
        self.assertEqual(items, original)

    def test_invalid_corrections_are_rejected(self):
        for failure in ("hash", "policy", "authorization", "missing", "duplicate", "collision"):
            with self.subTest(failure=failure):
                items, d = self.fixture()
                if failure == "hash":
                    d["ingredients_sha256"] = "changed"
                if failure == "policy":
                    d["policy_sha256"] = "changed"
                if failure == "authorization":
                    d.pop("authorization")
                if failure == "missing":
                    d["edits"][0]["after"].pop()
                if failure == "duplicate":
                    d["edits"].append(copy.deepcopy(d["edits"][0]))
                if failure == "collision":
                    d["edits"][0]["after"][1]["english_name"] = "Grits, without salt"
                with self.assertRaises(ValueError):
                    apply_decisions(items, d, "test")

    def test_export_replays_correction_without_changing_votes(self):
        review = review_fixture()
        old_votes = copy.deepcopy(review["grouping_review"])
        items = review["ingredients"]
        decisions = {
            "ingredients_sha256": digest(items),
            "policy_sha256": review["metadata"]["policy_sha256"],
            "authorization": "User delegates corrections",
            "reviewer": "Reviewer",
            "scope": "Test",
            "edits": [
                {
                    "before": copy.deepcopy(items[0]),
                    "reason": "Preserve form",
                    "after": [{"english_name": "Rice, dry", "source_ids": items[0]["source_ids"]}],
                }
            ],
        }
        review["grouping_decisions"] = decisions
        review["ingredients"] = apply_decisions(items, decisions, decisions["policy_sha256"])
        validate_selected(review)
        render(review)
        self.assertEqual(review["grouping_review"], old_votes)
        review["ingredients"][0]["english_name"] = "Tampered"
        with self.assertRaises(ValueError):
            validate_selected(review)
