# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Call Gemini's free-eligible text models through the official generateContent API."""

import argparse
import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .agent_prompt import build_prompt
from .run_agents import DATA_DIR, validate_result


API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
FREE_ELIGIBLE_MODELS = ("gemini-3.8-flash", "gemini-3.5-flash-lite")


def load_api_key(env_path=DATA_DIR / ".env"):
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        name, value = stripped.split("=", 1)
        if name.strip() == "GEMINI_API_KEY":
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            return value or None
    return None


def generate(prompt, model, api_key, timeout=120, opener=urlopen, pause=time.sleep):
    if model not in FREE_ELIGIBLE_MODELS:
        raise ValueError(f"model is not in the free-eligible allowlist: {model}")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }
    request = Request(
        f"{API_BASE}/{model}:generateContent",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    for attempt in range(5):
        try:
            with opener(request, timeout=timeout) as response:
                payload = json.load(response)
            candidates = payload.get("candidates", [])
            if not candidates:
                raise ValueError("Gemini returned no candidates")
            parts = candidates[0].get("content", {}).get("parts", [])
            answer = "".join(part.get("text", "") for part in parts)
            if not answer:
                raise ValueError("Gemini returned no text")
            return json.loads(answer)
        except HTTPError as error:
            status = error.code
            error.close()
            if status in {429, 500, 502, 503, 504} and attempt < 4:
                pause(min(30, 2 ** attempt))
                continue
            raise RuntimeError(f"Gemini API returned HTTP {status}; check quota and project tier") from None
        except (URLError, TimeoutError) as error:
            if attempt < 4:
                pause(min(30, 2 ** attempt))
                continue
            reason = error.reason if isinstance(error, URLError) else "request timed out"
            raise RuntimeError(f"Gemini API connection failed after retries: {reason}") from None
    raise RuntimeError("Gemini API retry limit reached")


def invoke(task_path, output_path, instructions_path, policy_path, model, timeout=120):
    task, prompt = build_prompt(task_path, instructions_path, policy_path)
    key = load_api_key()
    for attempt in range(5):
        answer = generate(prompt, model, key, timeout)
        if isinstance(answer, list):
            answer = {"task_id": task["task_id"], "rows": answer}
        try:
            validate_result(task, answer)
            break
        except ValueError as error:
            if attempt == 4:
                raise
            prompt += (f"\n\nYour previous JSON failed validation: {error}. "
                       "The decision value must be exactly INCLUDE, EXCLUDE, or UNRESOLVED; "
                       "MERGE and ACCEPT are not valid output decisions. "
                       f"Regenerate the complete response for {task['task_id']}. "
                       "Return one row for each of these codes, in this order, with no duplicate or invented code: "
                       + ", ".join(row["code"] for row in task["rows"]) + ".")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(answer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--task", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--instructions", type=Path, required=True)
    parser.add_argument("--policy", type=Path, required=True)
    parser.add_argument("--pass", dest="agent_pass", choices=["a", "b"], required=True)
    parser.add_argument("--model-a", choices=FREE_ELIGIBLE_MODELS, default="gemini-3.5-flash-lite")
    parser.add_argument("--model-b", choices=FREE_ELIGIBLE_MODELS, default="gemini-3.5-flash-lite")
    parser.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args()
    model = args.model_a if args.agent_pass == "a" else args.model_b
    invoke(args.task, args.output, args.instructions, args.policy, model, args.timeout)


if __name__ == "__main__":
    main()
