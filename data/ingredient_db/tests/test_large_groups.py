# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 큰 비교군의 요청 간 통합과 성공 응답 재사용 검증

import tempfile
import unittest
from pathlib import Path

from data.ingredient_db.large_groups import call, run
from data.ingredient_db.runner import AgentRunner, write_json


class LargeGroupTests(unittest.TestCase):
    def test_cross_chunk_merge_and_failed_chunk_resume(self):
        sources = [{"source_id": i, "description": "Pancakes, dry mix"} for i in range(1, 82)]
        components = [{"component_id": 1, "sources": sources}]
        requests = []
        fail = True

        def request(prompt, schema, **kwargs):
            requests.append(prompt)
            if "names" in schema["properties"]:
                return {"names": ["Pancake mix"]}
            if fail and "41" in schema["properties"]:
                raise RuntimeError("Injected failure")
            return {
                sid: {"name": "Pancake mix", "reason": "Dry mix"} for sid in schema["properties"]
            }

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            runner = AgentRunner(work, policy_text="policy", source_hash="source", request=request)
            with self.assertRaisesRegex(RuntimeError, "Injected failure"):
                run("a", "grouping/batch-1", components, runner.call, work)
            fail = False
            result = run("a", "grouping/batch-1", components, runner.call, work)
            self.assertEqual(len(requests), 5)  # names + first chunk reused; failed chunk retried
            self.assertEqual(result["components"][0]["groups"][0]["source_ids"], list(range(1, 82)))
            self.assertEqual(len(result["components"][0]["groups"]), 1)

    def test_existing_success_uses_original_call_without_new_protocol(self):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            original = {"components": []}
            path = work / "submissions/grouping/a/batch-1.json"
            write_json(path, {"response": original, "fingerprint": "original"})
            before = path.read_bytes()
            calls = []

            def original_call(*args):
                calls.append(args)
                return original

            result = call(
                "a",
                "grouping/batch-1",
                "original prompt",
                {},
                lambda value: None,
                components=[],
                call_agent=original_call,
                work_dir=work,
            )
            self.assertEqual(result, original)
            self.assertEqual(calls[0][1:3], ("grouping/batch-1", "original prompt"))
            self.assertEqual(path.read_bytes(), before)

    def test_missing_ids_and_unknown_names_are_rejected(self):
        for bad in ({}, {"1": {"name": "Unknown name", "reason": "Test"}}):

            def fake(agent, task, prompt, schema, validate, bad=bad):
                payload = {"names": ["Rice"]} if task.endswith("-names") else bad
                validate(payload)
                return payload

            with self.subTest(bad=bad), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    run(
                        "a",
                        "grouping/batch-1",
                        [{"component_id": 1, "sources": [{"source_id": 1, "description": "Rice"}]}],
                        fake,
                        Path(directory),
                    )
