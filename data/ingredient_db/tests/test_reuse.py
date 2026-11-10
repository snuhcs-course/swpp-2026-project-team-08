# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 기존 표 보존·누락 슬롯 재개·짧은 응답의 검증

import copy
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from data.ingredient_db.restrictions import RESTRICTION_TYPES, rows_from_wire
from data.ingredient_db.reuse import collect_missing, import_votes, validate_reuse
from data.ingredient_db.runner import AGENTS, AgentRunner, digest, write_json
from data.ingredient_db.selection import decode_selection


def fixture():
    source = {"metadata": {"release": "test"}, "rows": [{"source_id": i} for i in range(1, 5)]}
    return source


def vote(i):
    return {"decision": "INCLUDE", "english_name": f"Ingredient {i}", "reason": "Source"}


class ReuseTests(unittest.TestCase):
    def seed(self, old, source):
        write_json(old / "source.json", source)
        write_json(
            old / "manifest.json",
            {
                "source": source["metadata"],
                "source_sha256": digest(source),
                "policy_sha256": "old policy",
                "thinking_level": "high",
                "model": "old model",
            },
        )
        for agent, ids in {"a": [1, 2], "b": [1], "c": [1, 2, 3]}.items():
            write_json(
                old / "submissions/selection" / agent / "batch-0001.json",
                {
                    "fingerprint": "old request",
                    "response": {"rows": {str(i): vote(i) for i in ids}},
                },
            )

    def test_only_missing_agent_source_pairs_are_requested_and_failure_resumes(self):
        source = fixture()
        with tempfile.TemporaryDirectory() as directory:
            old, work = Path(directory) / "old", Path(directory) / "new"
            self.seed(old, source)
            record = import_votes(old, work, source)
            self.assertEqual(record["metadata"]["thinking_level"], "high")
            requests = []
            fail = True

            def request(prompt, schema, **kwargs):
                ids = schema["properties"]["rows"]["required"]
                requests.append(set(map(int, ids)))
                if fail and ids == ["4"]:
                    raise ValueError("injected")
                return {
                    "rows": {
                        i: {"d": "INCLUDE", "n": f"Ingredient {i}", "r": "Source"} for i in ids
                    }
                }

            runner = AgentRunner(
                work, policy_text="new", source_hash=digest(source), request=request, attempts=1
            )
            with ThreadPoolExecutor(max_workers=3) as pool:
                with self.assertRaisesRegex(RuntimeError, "injected"):
                    collect_missing(
                        source["rows"], record, pool=pool, call_agent=runner.call, batch_size=100
                    )
            fail = False
            with ThreadPoolExecutor(max_workers=3) as pool:
                result = collect_missing(
                    source["rows"], record, pool=pool, call_agent=runner.call, batch_size=100
                )
            self.assertTrue(all(1 not in ids for ids in requests))
            self.assertEqual(requests.count({3, 4}), 1)
            self.assertEqual(requests.count({2, 3, 4}), 1)
            for agent in AGENTS:
                self.assertEqual(len(result[agent]), 4)
                for row in record["votes"][agent]:
                    self.assertIn(row, result[agent])
            review = [
                {
                    "source_id": i,
                    "votes": {
                        agent: next(v for v in result[agent] if v["source_id"] == i)
                        for agent in AGENTS
                    },
                }
                for i in range(1, 5)
            ]
            validate_reuse(record, source["rows"], review)
            review[0]["votes"]["a"]["reason"] = "changed"
            with self.assertRaisesRegex(ValueError, "changed"):
                validate_reuse(record, source["rows"], review)

    def test_wrong_source_and_duplicate_imports_are_rejected(self):
        source = fixture()
        with tempfile.TemporaryDirectory() as directory:
            old, work = Path(directory) / "old", Path(directory) / "new"
            self.seed(old, source)
            changed = copy.deepcopy(source)
            changed["rows"][0]["description"] = "changed"
            with self.assertRaisesRegex(ValueError, "same complete source"):
                import_votes(old, work, changed)
            first = old / "submissions/selection/a/batch-0001.json"
            first.with_name("batch-0002.json").write_bytes(first.read_bytes())
            with self.assertRaisesRegex(ValueError, "duplicate"):
                import_votes(old, work, source)

    def test_short_wire_preserves_semantics_and_rejects_missing_restrictions(self):
        self.assertEqual(
            decode_selection({"rows": {"1": {"d": "INCLUDE", "n": "Rice", "r": "Grain"}}}, {1}),
            [{"source_id": 1, "decision": "INCLUDE", "english_name": "Rice", "reason": "Grain"}],
        )
        ingredients = [{"id": 1}]
        payload = {
            "rows": [
                {"i": 1, "t": t, "d": "UNKNOWN", "r": "Missing fact"} for t in RESTRICTION_TYPES
            ]
        }
        self.assertEqual(len(rows_from_wire(ingredients, payload)["rows"]), 19)
        payload["rows"].pop()
        with self.assertRaisesRegex(ValueError, "missing"):
            rows_from_wire(ingredients, payload)
