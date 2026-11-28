# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 검증과 가드레일 이후의 분기 검증 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 문제의 대상을 음식 id 대신 추천 순서로 변경

"""검증·가드레일 노드 다음 분기. 그래프와 LLM은 실행하지 않고 분기 함수만 확인한다."""

import pytest

from app.features.suggestions.workflow.nodes import (
    MAX_ATTEMPTS,
    route_after_guardrail,
    route_after_validate,
)
from app.features.suggestions.workflow.state import ValidationProblem

RISK = ValidationProblem(kind="restriction_risk", position=1, ingredient="땅콩버터", risk=0.9)
INVALID = ValidationProblem(kind="wrong_count", count=2)


@pytest.mark.parametrize(
    ("problems", "attempts", "expected"),
    [
        pytest.param([], 1, "guardrail", id="검증_통과는_가드레일로"),
        pytest.param([], MAX_ATTEMPTS, "guardrail", id="마지막_시도도_가드레일로"),
        pytest.param([INVALID], 1, "compose", id="검증_실패는_재작성"),
        pytest.param([INVALID], MAX_ATTEMPTS, "__end__", id="검증_실패_횟수_소진은_종료"),
    ],
)
def test_after_validate(problems, attempts, expected) -> None:
    assert route_after_validate({"problems": problems, "attempts": attempts}) == expected


@pytest.mark.parametrize(
    ("problems", "attempts", "expected"),
    [
        pytest.param([], 1, "__end__", id="위험_없음은_종료"),
        pytest.param([], MAX_ATTEMPTS, "__end__", id="마지막_시도_위험_없음도_종료"),
        pytest.param([RISK], 1, "compose", id="위험은_재작성"),
        pytest.param([RISK], MAX_ATTEMPTS - 1, "compose", id="마지막_재시도_허용"),
        pytest.param([RISK], MAX_ATTEMPTS, "__end__", id="위험_횟수_소진은_종료"),
    ],
)
def test_after_guardrail(problems, attempts, expected) -> None:
    assert route_after_guardrail({"problems": problems, "attempts": attempts}) == expected
