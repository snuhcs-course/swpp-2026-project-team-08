# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

import pytest

from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS, route_after_validate
from app.features.suggestions.workflow.state import ValidationProblem


@pytest.mark.parametrize(
    ("invalid", "attempts", "expected"),
    [
        pytest.param(False, 1, "__end__", id="검증_성공시_종료"),
        pytest.param(False, MAX_ATTEMPTS, "__end__", id="마지막_시도_성공도_종료"),
        pytest.param(True, 1, "compose", id="검증_실패시_재작성"),
        pytest.param(True, MAX_ATTEMPTS - 1, "compose", id="마지막_재시도_허용"),
        pytest.param(True, MAX_ATTEMPTS, "__end__", id="횟수_소진시_종료"),
    ],
)
def test_검증_결과와_시도_횟수로_다음_노드를_선택한다(invalid, attempts, expected):
    # 준비: 분기 함수가 읽는 상태만 준비한다. 그래프·LLM은 실행하지 않는다.
    state = {
        "problems": [ValidationProblem(kind="missing_food", food_id="1")] if invalid else [],
        "attempts": attempts,
    }

    # 실행
    next_node = route_after_validate(state)

    # 검증
    assert next_node == expected
