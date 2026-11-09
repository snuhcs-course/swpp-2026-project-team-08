# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: Gemini JSON 호출과 비밀값을 노출하지 않는 오류 처리

"""Gemini generateContent API에 JSON 응답을 요청한다."""

import json
import math
import os
import re
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_MODEL = "gemini-3.5-flash-lite"
DEFAULT_THINKING_LEVEL = "high"


class RetryableError(RuntimeError):
    def __init__(self, message: str, *, retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after


def _seconds(value) -> float | None:
    if not isinstance(value, str):
        return None
    try:
        seconds = float(value.removesuffix("s"))
    except ValueError:
        return None
    return seconds if math.isfinite(seconds) and 0 <= seconds <= 3600 else None


def _retry_after(error: HTTPError) -> float | None:
    value = error.headers.get("Retry-After") if error.headers else None
    if not value:
        return None
    if (seconds := _seconds(value)) is not None:
        return seconds
    try:
        when = parsedate_to_datetime(value)
        if when.tzinfo is not None:
            return _seconds(str(max(0, (when - datetime.now(UTC)).total_seconds())))
    except (ValueError, TypeError, OverflowError):
        pass
    return None


def _rate_limit(error: HTTPError) -> tuple[float, bool]:
    """재시도 시간과 일일 한도 표시만 읽고 오류 본문은 외부로 전달하지 않는다."""
    delay = _retry_after(error)
    try:
        body = json.loads(error.read(65536))
    except (ValueError, UnicodeError, OSError):
        body = {}
    error_body = body.get("error") if isinstance(body, dict) else None
    details = error_body.get("details", []) if isinstance(error_body, dict) else []
    daily = False
    if not isinstance(details, list):
        details = []
    for item in details:
        if not isinstance(item, dict):
            continue
        if item.get("@type") == "type.googleapis.com/google.rpc.RetryInfo" and delay is None:
            delay = _seconds(item.get("retryDelay"))
        if item.get("@type") == "type.googleapis.com/google.rpc.QuotaFailure":
            violations = item.get("violations", [])
            if isinstance(violations, list):
                daily = daily or any(
                    isinstance(violation, dict)
                    and isinstance(violation.get("quotaId"), str)
                    and "perday" in violation["quotaId"].casefold()
                    for violation in violations
                )
    return delay if delay is not None else 60, daily


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Gemini returned duplicate JSON key: {key}")
        result[key] = value
    return result


def load_api_key(env_path: Path) -> str:
    if key := os.environ.get("GEMINI_API_KEY"):
        return key
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            name, separator, value = line.strip().partition("=")
            if separator and name.strip() == "GEMINI_API_KEY":
                value = value.strip()
                if len(value) > 1 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if value:
                    return value
    raise RuntimeError("GEMINI_API_KEY is not configured")


def generate(
    prompt: str,
    schema: dict,
    *,
    model: str,
    api_key: str,
    timeout: float = 120,
) -> dict:
    if not isinstance(api_key, str) or not api_key or any(c in api_key for c in "\r\n\x00"):
        raise RuntimeError("GEMINI_API_KEY has invalid format")
    if not re.fullmatch(r"[a-z0-9.-]+", model):
        raise ValueError("invalid Gemini model name")
    try:
        request = Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            data=json.dumps(
                {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "responseJsonSchema": schema,
                        "temperature": 0.2,
                        "thinkingConfig": {"thinkingLevel": DEFAULT_THINKING_LEVEL},
                    },
                },
                ensure_ascii=False,
            ).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
            method="POST",
        )
        with urlopen(request, timeout=timeout) as response:
            envelope = json.load(response)
    except HTTPError as error:
        status = error.code
        try:
            delay, daily = _rate_limit(error) if status == 429 else (_retry_after(error), False)
        finally:
            error.close()
        if daily:
            raise RuntimeError("Gemini daily quota exhausted; resume after quota resets") from None
        if status == 429:
            raise RetryableError("Gemini HTTP 429", retry_after=delay) from None
        if status in {500, 502, 503, 504}:
            if status == 503 and delay is None:
                delay = 30
            raise RetryableError(f"Gemini HTTP {status}", retry_after=delay) from None
        raise RuntimeError(f"Gemini HTTP {status}; check model and API access") from None
    except (URLError, TimeoutError):
        raise RetryableError("Gemini connection failed") from None
    except json.JSONDecodeError:
        raise RetryableError("Gemini returned invalid response JSON") from None
    except (ValueError, UnicodeError, TypeError):
        # HTTP 헤더 인코딩 오류에는 원래 헤더 값이 포함될 수 있다.
        raise RuntimeError("Gemini request could not be encoded") from None
    candidates = envelope.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini returned no candidate")
    candidate = candidates[0]
    if candidate.get("finishReason") != "STOP":
        raise ValueError("Gemini response is incomplete")
    answer = "".join(
        part.get("text", "")
        for part in candidate.get("content", {}).get("parts", [])
        if not part.get("thought")
    )
    payload = json.loads(answer, object_pairs_hook=_unique_object)
    if not isinstance(payload, dict):
        raise ValueError("Gemini response must be a JSON object")
    return payload
