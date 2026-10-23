# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Check that ambiguous names stay visible in the ingredient draft."""

import copy
import unittest

from data.ingredient_db.code.build_ingredient_draft import build_draft, build_reviewed_draft


class ExportDraftTests(unittest.TestCase):
    def test_same_korean_name_with_conflicting_english_is_unresolved(self):
        rows = [
            {"code": "A", "decision": "INCLUDE", "name_ko": "버섯", "name_en": "Mushroom"},
            {"code": "B", "decision": "INCLUDE", "name_ko": "버섯", "name_en": "Fungus"},
            {"code": "C", "decision": "EXCLUDE", "name_ko": "", "name_en": ""},
        ]
        draft = build_draft(rows)
        self.assertEqual(len(draft["ingredients"]), 1)
        ingredient = draft["ingredients"][0]
        self.assertIsNone(ingredient["eng_name"])
        self.assertEqual(ingredient["english_options"], ["Fungus", "Mushroom"])
        self.assertEqual(ingredient["source_codes"], ["A", "B"])
        self.assertTrue(ingredient["review_required"])
        self.assertTrue(ingredient["english_name_conflict"])

    def test_review_coverage_and_provenance(self):
        agreed = {"code": "A", "decision": "INCLUDE", "name_ko": "감자", "name_en": "Potato", "reason": "원물"}
        pending = dict(agreed, code="B", name_ko="감자 조각")
        reconciliation = {"rows": [
            {"code": "A", "status": "AGREED_DRAFT", "a": agreed},
            {"code": "B", "status": "HUMAN_REVIEW", "a": pending}]}
        review = {"reviewer_model": "GPT-6 Astra", "decisions": [dict(agreed, code="B")]}
        result = build_reviewed_draft(reconciliation, review)
        self.assertEqual(len(result["ingredients"]), 1)
        self.assertEqual(result["ingredients"][0]["ai_reviewed_source_codes"], ["B"])
        self.assertFalse(result["ingredients"][0]["review_required"])
        self.assertEqual(result["review"]["agreed_source_rows_without_individual_review"], 1)
        for codes in ([], [review["decisions"][0]] * 2, [dict(agreed, code="C")]):
            with self.assertRaisesRegex(ValueError, "exactly once"):
                build_reviewed_draft(reconciliation, dict(review, decisions=codes))
        invalid = copy.deepcopy(review)
        invalid["decisions"][0]["decision"] = "EXCLUDE"
        with self.assertRaisesRegex(ValueError, "names"):
            build_reviewed_draft(reconciliation, invalid)

    def test_english_override_is_explicit_and_preserves_options(self):
        rows = [{"code": str(i), "decision": "INCLUDE", "name_ko": "감자", "name_en": en, "reason": "원물"}
                for i, en in enumerate(("Potato", "Potatoes"))]
        reconciliation = {"rows": [{"code": r["code"], "status": "HUMAN_REVIEW", "a": r} for r in rows]}
        review = {"reviewer_model": "GPT-6 Astra", "decisions": rows,
                  "name_overrides": [{"kor_name": "감자", "eng_name": "Potato", "reason": "단수 표기 통일"}]}
        without_override = build_reviewed_draft(reconciliation, dict(review, name_overrides=[]))
        self.assertEqual(without_override["ingredients"], [])
        self.assertEqual(without_override["unresolved_name_groups"][0]["source_codes"], ["0", "1"])
        with self.assertRaisesRegex(ValueError, "partial"):
            build_reviewed_draft(reconciliation, dict(review, partial=True))
        result = build_reviewed_draft(reconciliation, review)
        self.assertEqual(result["ingredients"][0]["eng_name"], "Potato")
        self.assertEqual(result["ingredients"][0]["english_options"], ["Potato", "Potatoes"])
        self.assertFalse(result["ingredients"][0]["english_name_conflict"])


if __name__ == "__main__":
    unittest.main()
