# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 유효 응답 캐시와 실패 슬롯 재개 검증

import json
import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.runner import AgentRunner, pin_run


def validate(payload):
    if payload != {"answer": 1}:
        raise ValueError("bad response")


class RunnerTests(unittest.TestCase):
    def test_valid_slots_are_reused_and_invalid_slot_is_retried(self):
        calls = []

        def request(prompt, schema, **kwargs):
            calls.append(prompt)
            return {"answer": 1}

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            runner = AgentRunner(work, policy_text="policy", source_hash="hash", request=request)
            for agent in "abc":
                runner.call(agent, "selection/one", "task", {}, validate)
            path = work / "submissions/selection/b/one.json"
            path.write_text("{broken")
            for agent in "abc":
                runner.call(agent, "selection/one", "task", {}, validate)
            self.assertEqual(len(calls), 4)
            self.assertTrue(path.with_suffix(".invalid.json").exists())

    def test_retry_keeps_one_vote(self):
        calls = []

        def request(prompt, schema, **kwargs):
            calls.append(1)
            return {"bad": True} if len(calls) == 1 else {"answer": 1}

        with tempfile.TemporaryDirectory() as directory:
            runner = AgentRunner(
                Path(directory),
                policy_text="policy",
                source_hash="hash",
                request=request,
                pause=lambda seconds: None,
            )
            self.assertEqual(runner.call("a", "selection/one", "task", {}, validate), {"answer": 1})
            files = list(Path(directory).rglob("*.json"))
            self.assertEqual(len(files), 1)
            self.assertEqual(json.loads(files[0].read_text())["response"], {"answer": 1})
            self.assertEqual(len(calls), 2)

    def test_changed_prompt_does_not_reuse_cache(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = AgentRunner(
                Path(directory),
                policy_text="policy",
                source_hash="hash",
                request=lambda *args, **kwargs: {"answer": 1},
            )
            runner.call("a", "selection/one", "task", {}, validate)
            with self.assertRaises(ValueError):
                runner.call("a", "selection/one", "changed", {}, validate)

    def test_model_and_policy_are_pinned(self):
        with tempfile.TemporaryDirectory() as directory:
            source = {"metadata": {}, "rows": []}
            work = Path(directory)
            first = pin_run(work, source, "policy", "model")
            self.assertEqual(pin_run(work, source, "policy", "model"), first)
            with self.assertRaises(ValueError):
                pin_run(work, source, "changed", "model")


if __name__ == "__main__":
    unittest.main()
