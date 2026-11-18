# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 테스트용 가짜 판정기 추가

"""가드레일 테스트용 가짜 판정기. 네트워크를 쓰지 않고 규칙대로 확률을 돌려준다."""

from collections.abc import Callable, Mapping
from typing import Any

# (state, 질문 이름, 질문 문장) -> 위험 확률
Rule = Callable[[Any, str, str], float]


class ScriptedJudge:
    """`risk` 규칙으로 질문마다 위험 확률을 돌려준다. 규칙이 없으면 모두 0(위험 없음)이다.

    `calls` 에는 호출마다 받은 (state, questions) 가 순서대로 쌓인다.
    `error` 를 주면 호출할 때 그 예외를 던진다 (판정 호출 실패를 흉내 낸다).
    """

    def __init__(self, risk: Rule | None = None, *, error: Exception | None = None) -> None:
        self._risk = risk
        self._error = error
        self.calls: list[tuple[Any, dict[str, str]]] = []

    @classmethod
    def flagging(cls, *needles: str, probability: float = 0.9) -> "ScriptedJudge":
        """질문 문장에 needle 이 들어 있으면 위험하다고 답한다 (재료별 질문에 이름이 들어 있다)."""
        return cls(
            lambda state, name, question: (
                probability if any(needle in question for needle in needles) else 0.0
            )
        )

    async def ask(self, state: Any, questions: Mapping[str, str]) -> dict[str, float]:
        self.calls.append((state, dict(questions)))
        if self._error is not None:
            raise self._error
        rule = self._risk or (lambda state, name, question: 0.0)
        return {name: rule(state, name, question) for name, question in questions.items()}
