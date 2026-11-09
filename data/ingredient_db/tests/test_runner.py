# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 유효 응답 캐시와 실패 슬롯 재개 검증

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from data.ingredient_db.gemini import RetryableError
from data.ingredient_db.runner import AgentRunner, pin_run
from data.ingredient_db.selection import validate_selection


def validate(payload):
    if payload != {"answer": 1}:
        raise ValueError("bad response")


class RunnerTests(unittest.TestCase):
    def test_rate_limit_delay_is_honored_in_at_most_sixty_second_waits(self):
        calls, pauses = [], []

        def request(*args, **kwargs):
            calls.append(1)
            if len(calls) == 1:
                raise RetryableError("Gemini HTTP 429", retry_after=75)
            return {"answer": 1}

        with tempfile.TemporaryDirectory() as directory:
            runner = AgentRunner(
                Path(directory),
                policy_text="policy",
                source_hash="hash",
                request=request,
                pause=pauses.append,
            )
            self.assertEqual(runner.call("a", "selection/one", "task", {}, validate), {"answer": 1})
        self.assertEqual(pauses, [60, 15])

    def test_malformed_key_and_transport_errors_never_reach_logs_or_feedback(self):
        sentinel = "FAKE_AUDIT_KEY"
        for key, failure in (
            (sentinel + "\n", None),
            (sentinel, ValueError(sentinel)),
            (sentinel, UnicodeError(sentinel)),
        ):
            with (
                self.subTest(failure=type(failure).__name__),
                tempfile.TemporaryDirectory() as directory,
            ):
                work = Path(directory)
                output = io.StringIO()
                runner = AgentRunner(
                    work, policy_text="policy", source_hash="hash", pause=lambda seconds: None
                )
                with (
                    patch("data.ingredient_db.runner.load_api_key", return_value=key),
                    patch("data.ingredient_db.gemini.urlopen", side_effect=failure) as network,
                    contextlib.redirect_stdout(output),
                    self.assertRaises(RuntimeError) as caught,
                ):
                    runner.call("a", "selection/one", "task", {}, validate)
                if failure is None:
                    network.assert_not_called()
                artifacts = "".join(path.read_text() for path in work.rglob("*.json"))
                self.assertNotIn(sentinel, output.getvalue() + artifacts + str(caught.exception))

    def test_duplicate_cache_keys_force_a_new_valid_response(self):
        calls = []

        def request(*args, **kwargs):
            calls.append(1)
            return {"answer": 1}

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            runner = AgentRunner(work, policy_text="policy", source_hash="hash", request=request)
            runner.call("a", "selection/one", "task", {}, validate)
            path = work / "submissions/selection/a/one.json"
            cached = json.loads(path.read_text())
            path.write_text(
                '{"fingerprint":'
                + json.dumps(cached["fingerprint"])
                + ',"response":{"answer":0,"answer":1}}'
            )
            runner.call("a", "selection/one", "task", {}, validate)
            self.assertEqual(len(calls), 2)
            self.assertTrue(path.with_suffix(".invalid.json").exists())

    def test_identifier_typo_retries_with_its_own_validation_feedback(self):
        prompts = []

        def request(prompt, schema, **kwargs):
            prompts.append(prompt)
            return {
                "rows": [
                    {
                        "source_id": 172233 if len(prompts) == 1 else 172223,
                        "decision": "INCLUDE",
                        "english_name": "Queso fresco",
                        "reason": "Fresh cheese",
                    }
                ]
            }

        with tempfile.TemporaryDirectory() as directory:
            runner = AgentRunner(
                Path(directory),
                policy_text="policy",
                source_hash="hash",
                request=request,
                pause=lambda seconds: None,
            )
            response = runner.call(
                "a",
                "selection/batch-0002",
                "Classify source 172223",
                {},
                lambda result: validate_selection(result, {172223}),
            )
            self.assertEqual(response["rows"][0]["source_id"], 172223)
            self.assertEqual(len(prompts), 2)
            self.assertIn("source ID 172233", prompts[1])
            self.assertIn("required IDs are [172223]", prompts[1])
            self.assertIn("Regenerate the COMPLETE response", prompts[1])
            cache = json.loads(
                (Path(directory) / "submissions/selection/a/batch-0002.json").read_text()
            )
            self.assertEqual(cache["attempts"], 2)
            runner.call(
                "a",
                "selection/batch-0002",
                "Classify source 172223",
                {},
                lambda result: validate_selection(result, {172223}),
            )
            self.assertEqual(len(prompts), 2)

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
            files = list((Path(directory) / "submissions").rglob("*.json"))
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
