# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 세 에이전트의 응답 검증과 중단 후 재개

"""작업별 유효 응답을 저장하고 실패한 응답만 다시 요청한다."""

import hashlib
import json
import time
from collections.abc import Callable
from pathlib import Path

from .gemini import (
    DEFAULT_MODEL,
    DEFAULT_THINKING_LEVEL,
    RetryableError,
    _unique_object,
    generate,
    load_api_key,
)

AGENTS = ("a", "b", "c")
ROOT = Path(__file__).resolve().parent


def digest(value: object) -> str:
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    try:
        temporary.write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def pin_run(work_dir: Path, source: dict, policy_text: str, model: str) -> dict:
    manifest = {
        "model": model,
        "agents": list(AGENTS),
        "source": source["metadata"],
        "policy_sha256": hashlib.sha256(policy_text.encode("utf-8")).hexdigest(),
        "source_sha256": digest(source),
        "temperature": 0.2,
        "thinking_level": DEFAULT_THINKING_LEVEL,
    }
    path = work_dir / "manifest.json"
    if path.exists() and json.loads(path.read_text(encoding="utf-8")) != manifest:
        raise ValueError("source, policy or model settings changed; use a new work directory")
    write_json(path, manifest)
    return manifest


class AgentRunner:
    def __init__(
        self,
        work_dir: Path,
        *,
        policy_text: str,
        source_hash: str,
        model: str = DEFAULT_MODEL,
        request: Callable = generate,
        attempts: int = 3,
        pause: Callable = time.sleep,
        timeout: float = 120,
    ):
        if attempts < 1:
            raise ValueError("attempts must be positive")
        self.work_dir = work_dir
        self.policy_text = policy_text
        self.source_hash = source_hash
        self.model = model
        self.request = request
        self.attempts = attempts
        self.pause = pause
        self.timeout = timeout

    def call(
        self, agent_id: str, task_id: str, prompt: str, schema: dict, validate: Callable
    ) -> dict:
        parts = task_id.split("/")
        if (
            agent_id not in AGENTS
            or len(parts) != 2
            or any(not part or part in {".", ".."} or "\\" in part for part in parts)
        ):
            raise ValueError("invalid agent or task ID")
        full_prompt = (
            "Classify independently. Do not use answers from another pass. "
            "Return only the JSON object required by the schema.\n\n"
            f"POLICY:\n{self.policy_text}\n\nTASK:\n{prompt}"
        )
        fingerprint = digest(
            {
                "model": self.model,
                "prompt": full_prompt,
                "schema": schema,
                "source_sha256": self.source_hash,
                "temperature": 0.2,
                "thinking_level": DEFAULT_THINKING_LEVEL,
            }
        )
        path = self.work_dir / "submissions" / parts[0] / agent_id / f"{parts[1]}.json"
        if path.exists():
            try:
                cached = json.loads(
                    path.read_text(encoding="utf-8"), object_pairs_hook=_unique_object
                )
            except (ValueError, UnicodeDecodeError):
                cached = None
            if isinstance(cached, dict) and cached.get("fingerprint"):
                if cached["fingerprint"] != fingerprint:
                    raise ValueError(
                        f"cached inputs changed for {task_id}; use a new work directory"
                    )
                try:
                    validate(cached["response"])
                except (ValueError, KeyError, TypeError):
                    pass
                else:
                    return cached["response"]
            path.replace(path.with_suffix(".invalid.json"))
        key = load_api_key(ROOT / ".env") if self.request is generate else ""
        request_prompt = full_prompt
        for attempt in range(self.attempts):
            payload = None
            try:
                payload = self.request(
                    request_prompt, schema, model=self.model, api_key=key, timeout=self.timeout
                )
                validate(payload)
                write_json(
                    path,
                    {
                        "fingerprint": fingerprint,
                        "request_sha256": digest(request_prompt),
                        "attempts": attempt + 1,
                        "response": payload,
                    },
                )
                return payload
            except (RetryableError, ValueError, KeyError, TypeError) as error:
                detail = f"{type(error).__name__}: {error}"
                write_json(
                    self.work_dir
                    / "invalid"
                    / parts[0]
                    / agent_id
                    / f"{parts[1]}-attempt-{attempt + 1}.json",
                    {"fingerprint": fingerprint, "error": detail, "response": payload},
                )
                print(f"{task_id}/{agent_id} attempt {attempt + 1}: {detail}", flush=True)
                if attempt + 1 == self.attempts:
                    raise RuntimeError(
                        f"{task_id}/{agent_id} failed after {self.attempts} attempts: {detail}"
                    ) from None
                if not isinstance(error, RetryableError):
                    request_prompt = (
                        full_prompt
                        + "\n\nThe previous response failed validation: "
                        + detail
                        + ". Regenerate the COMPLETE response. Copy all input IDs exactly; "
                        "do not invent, omit, or duplicate any identifier."
                    )
                delay = min(30, 2 ** (attempt + 1))
                if isinstance(error, RetryableError) and error.retry_after is not None:
                    delay = error.retry_after
                    print(f"{task_id}/{agent_id} waits {delay:g}s before retry", flush=True)
                while delay > 0:
                    interval = min(60, delay)
                    self.pause(interval)
                    delay -= interval
        raise AssertionError("unreachable")
