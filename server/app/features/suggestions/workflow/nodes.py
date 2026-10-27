# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow

"""그래프의 노드.

노드는 얇게 둔다: 상태를 읽고, LLM이나 순수 함수를 호출하고, 바뀐 상태만 반환한다.
LLM은 `runtime.context`로 주입받는다 (노드가 전역 클라이언트를 import하지 않는다).
"""

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END
from langgraph.runtime import Runtime

from app.features.suggestions.ingredients import usable_ingredient_names
from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow import prompts
from app.features.suggestions.workflow.schemas import SuggestionsDraft
from app.features.suggestions.workflow.state import GraphState, InputState, SuggestionContext

# compose(작성)를 최대 몇 번 실행하는가. 처음 한 번 + 재시도 2번.
MAX_ATTEMPTS = 3

Update = dict[str, object]


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def prepare(state: InputState) -> Update:
    """입력으로 첫 대화를 만들고 내부 값을 초기화한다. 쓸 수 있는 재료 목록도 여기서 싣는다."""
    usable = usable_ingredient_names(state["restrictions"])
    return {
        "messages": [
            SystemMessage(prompts.SYSTEM_PROMPT),
            HumanMessage(prompts.build_user_prompt(state["foods"], state["child"], usable)),
        ],
        "results": [],
        "problems": [],
        "attempts": 0,
    }


async def compose(state: GraphState, runtime: Runtime[SuggestionContext]) -> Update:
    """대화 내용을 바탕으로 구조화된 제안을 작성하는 노드. 직전 검증 문제가 있으면 함께 알린다."""
    structured = runtime.context.llm.with_structured_output(SuggestionsDraft)
    messages = list(state["messages"])
    if state["problems"]:
        messages.append(HumanMessage(prompts.build_retry_message(state["problems"])))
    draft = await structured.ainvoke(messages)
    return {"results": draft.to_generated(), "attempts": state["attempts"] + 1}


def validate(state: GraphState) -> Update:
    """결과를 요청과 아이의 제한에 비춰 검증하는 노드 (순수 함수 호출)."""
    return {"problems": find_problems(state["foods"], state["results"], state["restrictions"])}


def route_after_validate(state: GraphState) -> str:
    """통과했거나 재시도를 다 썼으면 끝내고, 아니면 compose로 돌아간다."""
    if not state["problems"] or state["attempts"] >= MAX_ATTEMPTS:
        return END
    return "compose"
