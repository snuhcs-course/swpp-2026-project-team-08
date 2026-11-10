# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 선정 검토 보류와 Grouping 입력 분리 검증

import copy
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.audit import apply_audit
from data.ingredient_db.runner import AGENTS, digest
from data.ingredient_db.selection import reconcile_rows, run, validate_selected


class AuditTests(unittest.TestCase):
    def test_flagged_majority_is_held_without_becoming_a_fourth_vote(self):
        sources = [{"source_id": 1}, {"source_id": 2}]
        votes = {
            a: [
                {
                    "source_id": i,
                    "decision": "INCLUDE",
                    "english_name": f"Food {i}",
                    "reason": "Source",
                }
                for i in (1, 2)
            ]
            for a in AGENTS
        }
        inc, exc, pending, review, _ = reconcile_rows(sources, votes)
        original = copy.deepcopy(review)
        audit = {
            "reviewer": "GPT-6 Astra",
            "scope": "Boundary cases",
            "policy_sha256": "a" * 64,
            "majority_sha256": digest(review),
            "findings": [{"source_id": 1, "action": "EXCLUDE", "reason": "Recipe food"}],
        }
        new_inc, new_exc, held = apply_audit(inc, exc, pending, review, audit)
        self.assertEqual([r["source_id"] for r in new_inc], [2])
        self.assertEqual(new_exc, [])
        self.assertEqual([r["source_id"] for r in held], [1])
        self.assertEqual(review, original)

        def fake(agent, task, prompt, schema, validate):
            self.assertTrue(task.startswith("selection/"))
            ids = schema["properties"]["rows"]["items"]["properties"]["i"]["enum"]
            return {
                "rows": [{"i": i, "d": "INCLUDE", "n": f"Food {i}", "r": "Source"} for i in ids]
            }

        with tempfile.TemporaryDirectory() as folder:
            result = run(
                {"metadata": {}, "rows": sources}, Path(folder), call_agent=fake, audit=audit
            )
        self.assertEqual(result["ingredients"][0]["source_ids"], [2])
        self.assertEqual(result["selection_review"], original)
        validate_selected(result)
        result["selection_audit"]["majority_sha256"] = "wrong"
        with self.assertRaisesRegex(ValueError, "different votes"):
            validate_selected(result)

    def test_audit_cannot_include_or_repeat_sources(self):
        review = [{"source_id": 1}]
        audit = {
            "reviewer": "Reviewer",
            "scope": "Test",
            "policy_sha256": "a" * 64,
            "majority_sha256": digest(review),
            "findings": [{"source_id": 1, "action": "INCLUDE", "reason": "Unsupported"}],
        }
        with self.assertRaisesRegex(ValueError, "cannot promote"):
            apply_audit([], [], [], review, audit)
        audit["findings"][0]["action"] = "UNKNOWN"
        audit["findings"] *= 2
        with self.assertRaisesRegex(ValueError, "duplicate"):
            apply_audit([], [], [], review, audit)
