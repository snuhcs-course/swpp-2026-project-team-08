# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 호출 루프를 없애고 쓸 수 있는 재료 목록을 처음 프롬프트에 담도록 단순화
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 설명에 아이가 잘 먹는 음식(familiar) 입력 반영
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 검증 뒤에 아이의 제한을 판정하는 guardrail 노드 추가

"""제안 생성 그래프 조립.

    prepare → compose → validate ─┬─ 통과 ──────────→ guardrail ─┬─ 통과 또는 재시도 소진 → END
                                  └─ 실패 & 재시도 가능 → compose  └─ 위험 & 재시도 가능 → compose
                                     (실패 & 재시도 소진 → END)

- prepare: 음식 목록, 아이가 잘 먹는 음식, 이 아이가 쓸 수 있는 재료 목록을 담은 첫 대화를 만든다.
- compose: 구조화된 제안을 쓴다.
- validate: 순수 함수로 검증하고, 문제가 있으면 compose로 돌아가 다시 쓴다.
- guardrail: 검증을 통과한 제안이 아이의 제한에 어긋날 확률을 판정 모델(Jev)에게 묻고,
  임계값 이상이면 compose로 돌아가 다시 쓴다. 아이의 제한이 없으면 판정하지 않는다.
  판정 호출이 실패하면 예외로 끝낸다 (안전성을 확인할 수 없으면 제안하지 않는다).
  재시도 횟수(MAX_ATTEMPTS)는 validate와 guardrail이 함께 쓴다.

그래프는 한 번만 컴파일해서 모든 요청이 재사용한다. 요청마다 달라지는 값은 입력 상태(foods,
catalog, familiar, restrictions)와 `context`(llm, judge, risk_threshold)로 넘긴다.
"""

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.features.suggestions.workflow import nodes
from app.features.suggestions.workflow.state import (
    GraphState,
    InputState,
    OutputState,
    SuggestionContext,
)


def build_graph() -> CompiledStateGraph:
    """그래프를 조립해 컴파일한다."""
    builder = StateGraph(
        GraphState,
        context_schema=SuggestionContext,
        input_schema=InputState,
        output_schema=OutputState,
    )
    builder.add_node("prepare", nodes.prepare)
    builder.add_node("compose", nodes.compose)
    builder.add_node("validate", nodes.validate)
    builder.add_node("guardrail", nodes.guardrail)

    builder.add_edge(START, "prepare")
    builder.add_edge("prepare", "compose")
    builder.add_edge("compose", "validate")
    builder.add_conditional_edges(
        "validate", nodes.route_after_validate, ["guardrail", "compose", END]
    )
    builder.add_conditional_edges("guardrail", nodes.route_after_guardrail, ["compose", END])
    return builder.compile()


graph = build_graph()
