# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""이름 충돌 해결에서 원본 코드가 빠지거나 중복되지 않았는지 검사한다."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ResolvedNameConflictsTests(unittest.TestCase):
    def test_original_codes_are_preserved_and_new_pairs_are_classified_or_unresolved(self):
        catalog = json.loads((ROOT / "ingredients-reviewed.json").read_text(encoding="utf-8"))
        relations = json.loads((ROOT.parent / "ingredient_restrictions/relations-reviewed.json")
                               .read_text(encoding="utf-8"))
        rda = json.loads((ROOT / "rda-source.json").read_text(encoding="utf-8"))
        audit = catalog["name_conflict_resolution"]
        self.assertEqual((audit["groups_resolved"], audit["source_rows"],
                          audit["ingredients_added"]), (19, 86, 20))
        codes = [c for d in audit["decisions"] for c in d["source_codes"]]
        self.assertEqual(len(codes), len(set(codes)))
        self.assertLessEqual(set(codes), {r["source_record_id"] for r in rda["rows"]})
        self.assertEqual(catalog["unresolved_name_groups"], [])
        self.assertEqual(len(catalog["ingredients"]), 1613)
        self.assertEqual(len(relations["rows"]), 1613 * 17)
        new_names = {d["kor_name"] for d in audit["decisions"]}
        new_rows = [r for r in relations["rows"] if r["ingredient_key"] in new_names]
        self.assertEqual(len(new_rows), 340)
        self.assertEqual(len({(r["ingredient_key"], r["restriction_id"]) for r in new_rows}), 340)
        self.assertTrue(all(r["review_status"] == ("UNRESOLVED" if r["relation"] is None
                                                        else "DECIDED") for r in new_rows))
        self.assertEqual(relations["name_conflict_pairs_pending_review"],
                         sum(r["relation"] is None for r in new_rows))
        lobster = next(d for d in audit["decisions"] if d["kor_name"] == "바닷가재류")
        self.assertEqual(len(lobster["source_codes"]), 4)


if __name__ == "__main__":
    unittest.main()
