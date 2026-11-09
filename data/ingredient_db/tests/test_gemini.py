# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: Gemini 요청 형식과 실패 응답 검증

import io
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from data.ingredient_db.gemini import RetryableError, generate


class GeminiTests(unittest.TestCase):
    def test_rate_limit_uses_retry_info_or_header_without_exposing_body(self):
        for headers, expected in (({}, 37.5), ({"Retry-After": "12"}, 12)):
            body = {
                "error": {
                    "message": "FAKE_PRIVATE_DETAIL",
                    "details": [
                        {"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "37.5s"}
                    ],
                }
            }
            error = HTTPError(
                "https://example.test",
                429,
                "rate limited",
                headers,
                io.BytesIO(json.dumps(body).encode()),
            )
            with patch("data.ingredient_db.gemini.urlopen", side_effect=error):
                with self.assertRaises(RetryableError) as caught:
                    generate("prompt", {}, model="gemini-3.5-flash-lite", api_key="secret")
            self.assertEqual(caught.exception.retry_after, expected)
            self.assertNotIn("FAKE_PRIVATE_DETAIL", str(caught.exception))

    def test_daily_quota_stops_instead_of_retrying_or_changing_model(self):
        body = {
            "error": {
                "details": [
                    {
                        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
                        "violations": [
                            {"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"}
                        ],
                    }
                ]
            }
        }
        error = HTTPError(
            "https://example.test", 429, "rate limited", {}, io.BytesIO(json.dumps(body).encode())
        )
        with patch("data.ingredient_db.gemini.urlopen", side_effect=error):
            with self.assertRaises(RuntimeError) as caught:
                generate("prompt", {}, model="gemini-3.5-flash-lite", api_key="secret")
        self.assertNotIsInstance(caught.exception, RetryableError)
        self.assertIn("daily quota exhausted", str(caught.exception))

    def test_duplicate_json_keys_are_rejected_before_one_vote_overwrites_another(self):
        response = {
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {
                        "parts": [
                            {
                                "text": '{"rows":{"172223":{"decision":"INCLUDE"},'
                                '"172223":{"decision":"EXCLUDE"}}}'
                            }
                        ]
                    },
                }
            ]
        }
        with patch(
            "data.ingredient_db.gemini.urlopen",
            return_value=io.BytesIO(json.dumps(response).encode()),
        ):
            with self.assertRaisesRegex(ValueError, "duplicate JSON key: 172223"):
                generate("prompt", {}, model="gemini-3.5-flash-lite", api_key="secret")

    def test_sends_key_in_header_and_accepts_complete_json(self):
        key = "opaque:secret+/="

        def opener(request, timeout):
            self.assertNotIn("secret", request.full_url)
            self.assertEqual(request.get_header("X-goog-api-key"), key)
            config = json.loads(request.data)["generationConfig"]
            self.assertEqual(config["responseMimeType"], "application/json")
            self.assertEqual(config["responseJsonSchema"], {"type": "object"})
            return io.BytesIO(
                json.dumps(
                    {
                        "candidates": [
                            {
                                "finishReason": "STOP",
                                "content": {"parts": [{"text": '{"answer":1}'}]},
                            }
                        ]
                    }
                ).encode()
            )

        with patch("data.ingredient_db.gemini.urlopen", opener):
            self.assertEqual(
                generate("prompt", {"type": "object"}, model="gemini-3.5-flash-lite", api_key=key),
                {"answer": 1},
            )

    def test_http_error_does_not_include_credentials_or_server_body(self):
        error = HTTPError(
            "https://example.test/?key=secret", 429, "secret", {}, io.BytesIO(b"secret")
        )
        with patch("data.ingredient_db.gemini.urlopen", side_effect=error):
            with self.assertRaises(RetryableError) as caught:
                generate("prompt", {}, model="gemini-3.5-flash-lite", api_key="secret")
        self.assertEqual(str(caught.exception), "Gemini HTTP 429")
        self.assertEqual(caught.exception.retry_after, 60)

    def test_truncated_output_is_not_accepted(self):
        response = {
            "candidates": [{"finishReason": "MAX_TOKENS", "content": {"parts": [{"text": "{}"}]}}]
        }
        with patch(
            "data.ingredient_db.gemini.urlopen",
            return_value=io.BytesIO(json.dumps(response).encode()),
        ):
            with self.assertRaises(ValueError):
                generate("prompt", {}, model="gemini-3.5-flash-lite", api_key="secret")


if __name__ == "__main__":
    unittest.main()
