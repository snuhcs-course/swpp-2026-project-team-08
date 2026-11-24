# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: agent 노드와 도구를 없애고 첫 프롬프트에 쓸 수 있는 재료 목록을 담도록 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: prepare 가 아이가 잘 먹는 음식을 첫 프롬프트에 함께 담도록 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: guardrail 노드 추가, compose 가 초안과 피드백을 대화 이력에 남기도록 변경

"""그래프의 노드.

노드는 얇게 둔다: 상태를 읽고, LLM이나 순수 함수를 호출하고, 바뀐 상태만 반환한다.
LLM은 `runtime.context`로 주입받는다 (노드가 전역 클라이언트를 import하지 않는다).
"""

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END
from langgraph.runtime import Runtime

from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow import prompts
from app.features.suggestions.workflow.guardrail import build_request, find_risks
from app.features.suggestions.workflow.schemas import SuggestionsDraft
from app.features.suggestions.workflow.state import GraphState, InputState, SuggestionContext

# compose(작성)를 최대 몇 번 실행하는가. 처음 한 번 + 재시도 2번.
MAX_ATTEMPTS = 3

Update = dict[str, object]


def prepare(state: InputState) -> Update:
    """입력 음식과 쓸 수 있는 재료 목록으로 첫 대화를 만들고 내부 값을 초기화한다."""
    return {
        "messages": [
            SystemMessage(prompts.SYSTEM_PROMPT),
            HumanMessage(
                prompts.build_user_prompt(state["foods"], state["catalog"], state["familiar"])
            ),
            HumanMessage(prompts.COMPOSE_INSTRUCTION),
        ],
        "results": [],
        "problems": [],
        "attempts": 0,
    }


async def compose(state: GraphState, runtime: Runtime[SuggestionContext]) -> Update:
    """대화 내용을 바탕으로 구조화된 제안을 작성하는 노드.

    직전 검증·가드레일 문제가 있으면 피드백으로 함께 알린다. 모델의 초안과 피드백은 대화 이력에
    남겨서, 다시 쓸 때 자기가 쓴 초안과 지금까지 지적된 문제를 모두 볼 수 있게 한다.
    """
    structured = runtime.context.llm.with_structured_output(SuggestionsDraft)
    feedback = (
        [HumanMessage(prompts.build_retry_message(state["problems"]))] if state["problems"] else []
    )
    draft = await structured.ainvoke([*state["messages"], *feedback])
    return {
        "messages": [*feedback, AIMessage(draft.model_dump_json())],
        "results": draft.to_generated(),
        "attempts": state["attempts"] + 1,
    }


def validate(state: GraphState) -> Update:
    """결과를 요청과 쓸 수 있는 재료에 비춰 검증하는 노드 (순수 함수 호출)."""
    return {"problems": find_problems(state["foods"], state["results"], state["catalog"])}


async def guardrail(state: GraphState, runtime: Runtime[SuggestionContext]) -> Update:
    """검증을 통과한 제안이 아이의 제한에 어긋날 가능성을 판정 모델에게 묻는 노드.

    제한이 없으면 판정하지 않는다. 판정 호출이 실패하면 예외를 그대로 올려 제안을 내지 않는다
    (안전성을 확인할 수 없으면 추천하지 않는다).
    """
    if not state["restrictions"]:
        return {"problems": []}
    request = build_request(state["restrictions"], state["results"])
    probabilities = await runtime.context.judge.ask(request.state, request.questions)
    return {"problems": find_risks(request, probabilities, runtime.context.risk_threshold)}


def route_after_validate(state: GraphState) -> str:
    """검증을 통과하면 가드레일로 가고, 문제가 있으면 재시도 여부에 따라 compose나 끝으로 간다."""
    if not state["problems"]:
        return "guardrail"
    return END if state["attempts"] >= MAX_ATTEMPTS else "compose"


def route_after_guardrail(state: GraphState) -> str:
    """위험이 없거나 재시도를 다 썼으면 끝내고, 아니면 compose로 돌아간다."""
    if not state["problems"] or state["attempts"] >= MAX_ATTEMPTS:
        return END
    return "compose"
