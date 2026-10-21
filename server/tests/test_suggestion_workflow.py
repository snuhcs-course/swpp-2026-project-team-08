# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""제안 생성 워크플로 테스트. 가짜 모델로 그래프 전체를 실행하고 LLM은 호출하지 않는다."""

import pytest
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import FoodInput
from tests.fake_chat_model import ScriptedChatModel

FOODS = [FoodInput(id="f1", name="Broccoli"), FoodInput(id="f2", name="Egg")]
RESTRICTIONS = ChildRestrictions(ids=frozenset({RestrictionId.PEANUT}))


def draft(food_id: str, ingredients: list[str]) -> SuggestionDraft:
    return SuggestionDraft(
        food_id=food_id,
        what_to_try="Offer a small piece.",
        why_this_may_help="Familiar pieces build trust.",
        serving_tip="Serve it separately.",
        used_ingredients=ingredients,
    )


def drafts(*per_food: list[str]) -> SuggestionsDraft:
    return SuggestionsDraft(
        suggestions=[draft(food.id, items) for food, items in zip(FOODS, per_food, strict=True)]
    )


def tool_call(candidates: list[str]) -> AIMessage:
    return AIMessage(
        content="",
        tool_calls=[
            {
                "name": "search_available_ingredients",
                "args": {"candidates": candidates},
                "id": "call-1",
            }
        ],
    )


def text_of(messages) -> str:
    return "\n".join(str(message.content) for message in messages)


async def test_tool_is_called_then_valid_result_is_returned():
    llm = ScriptedChatModel(
        replies=[tool_call(["땅콩버터", "carrot"]), AIMessage(content="확인 끝")],
        drafts=[drafts(["carrot"], ["rice"])],
    )

    results = await generate_suggestions(FOODS, RESTRICTIONS, llm=llm)

    assert [r.food_id for r in results] == ["f1", "f2"]
    assert results[0].used_ingredients == ("carrot",)
    assert len(llm.compose_inputs) == 1
    # 도구는 땅콩 제한이 있는 아이에게 쓸 수 있는 재료만 돌려준다.
    tool_messages = [m for m in llm.compose_inputs[0] if isinstance(m, ToolMessage)]
    assert [m.content for m in tool_messages] == ['["carrot"]']


async def test_invalid_result_is_retried_with_feedback():
    llm = ScriptedChatModel(
        replies=[AIMessage(content="확인 끝")],
        drafts=[drafts(["땅콩버터"], ["rice"]), drafts(["carrot"], ["rice"])],
    )

    results = await generate_suggestions(FOODS, RESTRICTIONS, llm=llm)

    assert results[0].used_ingredients == ("carrot",)
    assert len(llm.compose_inputs) == 2
    retry_message = llm.compose_inputs[1][-1]
    assert isinstance(retry_message, HumanMessage)
    assert "땅콩버터" in retry_message.content and "peanut" in retry_message.content
    # 첫 시도에는 재시도 지시문이 없다.
    assert "땅콩버터" not in text_of(llm.compose_inputs[0][-1:])


async def test_rejected_after_attempts_are_exhausted():
    llm = ScriptedChatModel(
        replies=[AIMessage(content="확인 끝")],
        drafts=[drafts(["땅콩버터"], ["rice"])] * MAX_ATTEMPTS,
    )

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, RESTRICTIONS, llm=llm)

    assert len(llm.compose_inputs) == MAX_ATTEMPTS
    assert [(p.kind, p.food_id, p.ingredient) for p in raised.value.problems] == [
        ("restricted_ingredient", "f1", "땅콩버터")
    ]


async def test_missing_food_is_rejected():
    only_first = SuggestionsDraft(suggestions=[draft("f1", ["carrot"])])
    llm = ScriptedChatModel(
        replies=[AIMessage(content="확인 끝")], drafts=[only_first] * MAX_ATTEMPTS
    )

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, RESTRICTIONS, llm=llm)

    assert [(p.kind, p.food_id) for p in raised.value.problems] == [("missing_food", "f2")]
