# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""새 재료 판정만 갱신하고 기존 결정은 보존하는지 검사한다."""
import unittest

from data.ingredient_restrictions.merge_name_conflict_results import merge


class NameConflictMergeTests(unittest.TestCase):
    def test_merge_replaces_only_new_unresolved_pairs(self):
        names = {"새우", "바닷가재류"}
        ids = [f"restriction-{i}" for i in range(17)]
        old = [{"ingredient_key": n, "restriction_id": rid, "relation": None,
                "review_status": "UNRESOLVED"} for n in names for rid in ids]
        old.append({"ingredient_key": "기존 재료", "restriction_id": ids[0],
                    "relation": "NEVER", "review_status": "DECIDED"})
        new = [dict(row, relation="ALWAYS", review_status="DECIDED") for row in old[:-1]]
        result = merge({"rows": old}, {"rows": new, "manifest_sha256": "test-manifest"}, names)
        rows = {(r["ingredient_key"], r["restriction_id"]): r for r in result["rows"]}
        self.assertEqual(rows["기존 재료", ids[0]]["relation"], "NEVER")
        self.assertEqual(result["name_conflict_classification"]["counts"], {"ALWAYS": 34})
        self.assertEqual(result["name_conflict_classification"]["manifest_sha256"], "test-manifest")
        self.assertEqual(result["name_conflict_pairs_pending_review"], 0)

    def test_existing_decision_is_not_overwritten(self):
        names = {"재료"}
        old = [{"ingredient_key": "재료", "restriction_id": str(i),
                "relation": "NEVER" if i == 0 else None} for i in range(17)]
        new = [dict(row, relation="ALWAYS", review_status="DECIDED") for row in old]
        with self.assertRaises(ValueError):
            merge({"rows": old}, {"rows": new}, names)


if __name__ == "__main__":
    unittest.main()
