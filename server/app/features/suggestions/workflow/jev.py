# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: OpenRouter Decisions API 로 Jev 에 yes/no 확률을 묻는 비동기 클라이언트 추가

"""Jev(TypeSafe 결정 모델) 호출 클라이언트.

Jev 는 채팅 모델이 아니라 `state` 와 질문을 받아 확률만 돌려주는 결정 모델이다.
OpenRouter 의 Decisions API(`POST /api/alpha/decisions`)로 호출하며 LangChain 을 거치지 않는다.
호출은 LangSmith 에서 보이도록 `@traceable` 로 감싼다. API 키는 호출 함수 인자에 넣지 않는다
(트레이스 입력에 기록되지 않도록 클라이언트 내부에만 둔다).
"""

from collections.abc import Mapping
from typing import Any

import httpx
from langsmith import traceable

DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions"
DEFAULT_TIMEOUT_SECONDS = 15.0


class JevError(Exception):
    """Jev 호출이 실패했거나 응답을 해석할 수 없을 때."""


def _without_self(inputs: Mapping[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in inputs.items() if key != "self"}


class JevClient:
    """질문마다 'yes 일 확률'(`noul`)을 돌려주는 클라이언트."""

    def __init__(
        self,
        api_key: str,
        model: str,
        *,
        http: httpx.AsyncClient | None = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._http = http
        self._timeout = timeout

    @traceable(
        name="jev_decisions",
        run_type="llm",
        process_inputs=_without_self,
        metadata={"ls_provider": "typesafe"},
    )
    async def ask(self, state: Any, questions: Mapping[str, str]) -> dict[str, float]:
        """`questions`(이름 → 질문 문장)마다 yes 확률(0~1)을 이름으로 묶어 돌려준다."""
        body = {
            "model": self._model,
            "state": state,
            "questions": {
                name: {"type": "noul", "instructions": instructions}
                for name, instructions in questions.items()
            },
        }
        data = await self._post(body)
        return self._read_probabilities(data, questions)

    async def _post(self, body: dict[str, Any]) -> Any:
        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        try:
            if self._http is not None:
                response = await self._http.post(
                    DECISIONS_URL, headers=headers, json=body, timeout=self._timeout
                )
            else:
                async with httpx.AsyncClient() as http:
                    response = await http.post(
                        DECISIONS_URL, headers=headers, json=body, timeout=self._timeout
                    )
        except httpx.HTTPError as error:
            raise JevError(f"Jev 호출 실패: {type(error).__name__}") from error
        if response.status_code != 200:
            raise JevError(f"Jev 응답 오류: HTTP {response.status_code}")
        try:
            return response.json()
        except ValueError as error:
            raise JevError("Jev 응답이 JSON 이 아닙니다.") from error

    @staticmethod
    def _read_probabilities(data: Any, questions: Mapping[str, str]) -> dict[str, float]:
        try:
            answers = data["answers"]
            return {name: float(answers[name]["noul"]) for name in questions}
        except (KeyError, TypeError, ValueError) as error:
            raise JevError("Jev 응답에서 확률을 읽을 수 없습니다.") from error
