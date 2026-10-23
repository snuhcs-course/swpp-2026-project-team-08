# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from data.ingredient_db.code.call_gemini_agent import generate, load_api_key


class GeminiAdapterTests(unittest.TestCase):
    def test_env_file_and_shell_precedence(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            env_file.write_text("# comment\nGEMINI_API_KEY='file-key'\n", encoding="utf-8")
            with patch.dict(os.environ, {}, clear=True):
                self.assertEqual(load_api_key(env_file), "file-key")
                os.environ["GEMINI_API_KEY"] = "shell-key"
                self.assertEqual(load_api_key(env_file), "shell-key")

    def test_json_response_and_header(self):
        expected = {"task_id": "task-001", "rows": []}
        response = {"candidates": [{"content": {"parts": [{"text": json.dumps(expected)}]}}]}
        def opener(request, timeout):
            self.assertEqual(request.get_header("X-goog-api-key"), "test-key")
            self.assertEqual(json.loads(request.data)["generationConfig"]["responseMimeType"], "application/json")
            return io.BytesIO(json.dumps(response).encode())

        self.assertEqual(generate("prompt", "gemini-3.8-flash", "test-key", opener=opener), expected)

    def test_missing_key_and_unlisted_model_fail_before_network(self):
        with self.assertRaisesRegex(ValueError, "GEMINI_API_KEY"):
            generate("prompt", "gemini-3.8-flash", "")
        with self.assertRaisesRegex(ValueError, "allowlist"):
            generate("prompt", "other-model", "test-key")

    def test_rate_limit_retries_then_stops(self):
        calls = []

        def opener(request, timeout):
            calls.append(request)
            raise HTTPError(request.full_url, 429, "quota", {}, io.BytesIO())

        with self.assertRaisesRegex(RuntimeError, "HTTP 429"):
            generate("prompt", "gemini-3.5-flash-lite", "test-key", opener=opener,
                     pause=lambda _: None)
        self.assertEqual(len(calls), 5)

    def test_temporary_server_error_retries(self):
        expected = {"task_id": "task-001", "rows": []}
        response = {"candidates": [{"content": {"parts": [{"text": json.dumps(expected)}]}}]}
        calls = []

        def opener(request, timeout):
            calls.append(request)
            if len(calls) == 1:
                raise HTTPError(request.full_url, 503, "unavailable", {}, io.BytesIO())
            return io.BytesIO(json.dumps(response).encode())

        self.assertEqual(generate("prompt", "gemini-3.5-flash-lite", "test-key",
                                  opener=opener, pause=lambda _: None), expected)
        self.assertEqual(len(calls), 2)

    def test_read_timeout_retries(self):
        expected = {"task_id": "task-001", "rows": []}
        response = {"candidates": [{"content": {"parts": [{"text": json.dumps(expected)}]}}]}
        calls = []

        def opener(request, timeout):
            calls.append(request)
            if len(calls) == 1:
                raise TimeoutError("read timed out")
            return io.BytesIO(json.dumps(response).encode())

        self.assertEqual(generate("prompt", "gemini-3.5-flash-lite", "test-key",
                                  opener=opener, pause=lambda _: None), expected)
        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main()
