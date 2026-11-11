# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 동일 재료의 제한 응답 재사용과 변경 차단 검증

import copy
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.restriction_reuse import build, responses
from data.ingredient_db.restrictions import run
from data.ingredient_db.runner import write_json
from data.ingredient_db.tests.test_export import review_fixture


class RestrictionReuseTests(unittest.TestCase):
    def test_same_identity_remaps_id_without_new_votes(self):
        previous = review_fixture()
        selected = copy.deepcopy(previous)
        selected["ingredients"][0]["id"] = 9
        record = build(previous, selected)
        actual = responses(record, selected["ingredients"], selected["sources"])
        self.assertEqual(len(actual["a"]["rows"]), 19)
        self.assertTrue(all(r["ingredient_id"] == 9 for r in actual["a"]["rows"]))
        wrong = copy.deepcopy(record)
        wrong["entries"][0]["original"]["source_ids"] = [999]
        with self.assertRaises(ValueError):
            responses(wrong, selected["ingredients"], selected["sources"])

    def test_changed_members_are_not_reused(self):
        previous = review_fixture()
        selected = copy.deepcopy(previous)
        selected["ingredients"][0]["source_ids"].append(999)
        self.assertFalse(build(previous, selected)["entries"])

    def test_reused_votes_reach_catalog_without_api(self):
        previous = review_fixture()
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            write_json(work / "selected.json", previous)
            write_json(work / "reused_restrictions.json", build(previous, previous))
            result = run(
                work / "selected.json", work, call_agent=lambda *args: self.fail("API called")
            )
        self.assertEqual(result["restriction_votes"], previous["restriction_votes"])
        responses(
            result["restriction_reuse"],
            result["ingredients"],
            result["sources"],
            result["restriction_votes"],
        )
        changed = copy.deepcopy(result["restriction_votes"])
        changed[0]["votes"]["a"]["reason"] = "Changed"
        with self.assertRaises(ValueError):
            responses(
                result["restriction_reuse"], result["ingredients"], result["sources"], changed
            )
