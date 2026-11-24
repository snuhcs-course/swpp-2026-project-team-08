# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 보류 확정·통합·제외의 원본 보존 검증

import copy
import unittest

from data.ingredient_db.catalog_decisions import apply_decisions
from data.ingredient_db.runner import digest


class CatalogTests(unittest.TestCase):
    def fixture(self):
        before = {
            "ingredients": [{"id": 1, "english_name": "Pancake mix", "source_ids": [1]}],
            "excluded": [{"source_id": 4, "reason": "Old exclusion"}],
            "unresolved": [
                {"source_id": 2, "reason": "No agreement"},
                {"source_id": 3, "reason": "No agreement"},
            ],
        }
        record = {
            "before_sha256": digest(before),
            "policy_sha256": "policy",
            "reviewer": "Reviewer",
            "authorization": "User delegates review",
            "scope": "All",
            "decisions": [
                {
                    "source_id": 1,
                    "action": "INCLUDE",
                    "english_name": "Pancake mix",
                    "reason": "Mix",
                },
                {
                    "source_id": 2,
                    "action": "INCLUDE",
                    "english_name": "Pancake mix",
                    "reason": "Mix",
                },
                {"source_id": 3, "action": "EXCLUDE", "reason": "Recipe food"},
                {
                    "source_id": 4,
                    "action": "INCLUDE",
                    "english_name": "Pancake mix",
                    "reason": "Dry mix",
                },
            ],
        }
        return before, record

    def test_merge_pending_and_correct_exclusion(self):
        before, record = self.fixture()
        original = copy.deepcopy(before)
        ingredients, excluded, pending = apply_decisions(
            before["ingredients"], before["excluded"], before["unresolved"], record, "policy"
        )
        self.assertEqual(
            ingredients, [{"id": 1, "english_name": "Pancake mix", "source_ids": [1, 2, 4]}]
        )
        self.assertEqual([r["source_id"] for r in excluded], [3])
        self.assertFalse(pending)
        self.assertEqual(before, original)

    def test_missing_duplicate_or_changed_review_rejected(self):
        for failure in ("missing", "duplicate", "unknown", "hash", "policy"):
            before, record = self.fixture()
            if failure == "missing":
                record["decisions"].pop(1)
            if failure == "duplicate":
                record["decisions"].append(record["decisions"][0])
            if failure == "unknown":
                record["decisions"][0]["source_id"] = 99
            if failure == "hash":
                record["before_sha256"] = "bad"
            if failure == "policy":
                record["policy_sha256"] = "bad"
            with self.subTest(failure=failure), self.assertRaises(ValueError):
                apply_decisions(
                    before["ingredients"],
                    before["excluded"],
                    before["unresolved"],
                    record,
                    "policy",
                )
