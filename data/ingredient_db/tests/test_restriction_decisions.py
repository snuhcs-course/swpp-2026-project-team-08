# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 제한 검토 보류의 재현·무결성과 최종 출력 검증

import copy
import unittest

from data.ingredient_db.export import render
from data.ingredient_db.runner import digest
from data.ingredient_db.tests.test_export import review_fixture


class RestrictionDecisionsTests(unittest.TestCase):
    def fixture(self):
        review = review_fixture()
        row = review["restriction_votes"][0]
        review["restriction_decisions"] = {
            "votes_sha256": digest(review["restriction_votes"]),
            "policy_sha256": review["metadata"]["policy_sha256"],
            "authorization": "User delegates review",
            "reviewer": "Reviewer",
            "scope": "Test",
            "edits": [
                {
                    "ingredient_id": row["ingredient_id"],
                    "restriction_type": row["restriction_type"],
                    "before": row["degree"],
                    "after": "UNKNOWN",
                    "reason": "Insufficient evidence",
                }
            ],
        }
        return review

    def test_review_omits_relationship_without_modifying_votes(self):
        review = self.fixture()
        original = copy.deepcopy(review["restriction_votes"])
        files, summary = render(review)
        self.assertEqual(len(files["ingredients_restrictions.jsonl"].splitlines()), 18)
        self.assertEqual(summary["unresolved_restrictions"], 1)
        self.assertEqual(summary["review_withheld_pairs"], 1)
        self.assertEqual(review["restriction_votes"], original)
        self.assertEqual(render(review), (files, summary))

    def test_invalid_review_cannot_change_output(self):
        for field in (
            "hash",
            "policy",
            "authorization",
            "duplicate",
            "unknown",
            "before",
            "promote",
        ):
            with self.subTest(field=field):
                review = self.fixture()
                audit = review["restriction_decisions"]
                edit = audit["edits"][0]
                if field == "hash":
                    audit["votes_sha256"] = "changed"
                if field == "policy":
                    audit["policy_sha256"] = "changed"
                if field == "authorization":
                    audit.pop("authorization")
                if field == "duplicate":
                    audit["edits"].append(copy.deepcopy(edit))
                if field == "unknown":
                    edit["ingredient_id"] = 999
                if field == "before":
                    edit["before"] = "ALWAYS"
                if field == "promote":
                    edit["after"] = "NEVER"
                with self.assertRaises(ValueError):
                    render(review)
