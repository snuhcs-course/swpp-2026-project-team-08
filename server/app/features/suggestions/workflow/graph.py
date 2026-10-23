# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""제안 생성 그래프 조립.

    prepare → compose → validate ─┬─ 통과 또는 재시도 소진 → END
                                  └─ 실패 & 재시도 가능 → compose

- prepare: 대상 · 아이 정보 · 쓸 수 있는 재료 목록으로 프롬프트를 만든다.
- compose: 구조화된 제안을 쓴다.
- validate: 순수 함수로 검증하고, 문제가 있으면 compose로 돌아가 다시 쓴다.

그래프는 한 번만 컴파일해서 모든 요청이 재사용한다. 요청마다 달라지는 값은 입력 상태(foods,
restrictions, child)와 `context`(llm)로 넘긴다.
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


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
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

    builder.add_edge(START, "prepare")
    builder.add_edge("prepare", "compose")
    builder.add_edge("compose", "validate")
    builder.add_conditional_edges("validate", nodes.route_after_validate, ["compose", END])
    return builder.compile()


graph = build_graph()
