# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: Gemini JSON 호출과 비밀값을 노출하지 않는 오류 처리

"""Gemini generateContent API에 JSON 응답을 요청한다."""

import json
import os
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_MODEL = "gemini-3.5-flash-lite"


class RetryableError(RuntimeError):
    pass


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
    if not re.fullmatch(r"[a-z0-9.-]+", model):
        raise ValueError("invalid Gemini model name")
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(
            {
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseJsonSchema": schema,
                    "temperature": 0.2,
                },
            },
            ensure_ascii=False,
        ).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            envelope = json.load(response)
    except HTTPError as error:
        status = error.code
        error.close()
        if status in {429, 500, 502, 503, 504}:
            raise RetryableError(f"Gemini HTTP {status}") from None
        raise RuntimeError(f"Gemini HTTP {status}; check model and API access") from None
    except (URLError, TimeoutError):
        raise RetryableError("Gemini connection failed") from None
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
    payload = json.loads(answer)
    if not isinstance(payload, dict):
        raise ValueError("Gemini response must be a JSON object")
    return payload
