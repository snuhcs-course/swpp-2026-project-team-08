# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 없이 프롬프트의 재료 목록으로 검증하는 워크플로 기준으로 재작성
"""제안 생성 워크플로 테스트. 가짜 모델로 그래프 전체를 실행하고 LLM은 호출하지 않는다."""

import pytest
from langchain_core.messages import HumanMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import FoodInput
from tests.helpers.fake_chat_model import ScriptedChatModel

FOODS = [
    FoodInput(
        id="f1",
        name="Broccoli",
        ingredients=("브로콜리",),
        cooking_method="STEAMED",
        outcome="UNTOUCHED",
        difficulty_reasons=("TEXTURE.HARDNESS.SOFT", "COLOR.GREEN"),
    ),
    FoodInput(id="f2", name="Egg"),
]
CATALOG = build_catalog(["당근", "쌀", "Tofu"])


def draft(food_id: str, ingredients: list[str]) -> SuggestionDraft:
    return SuggestionDraft(
        food_id=food_id,
        what_to_try="Offer a small piece.",
        why_this_may_help="Familiar pieces build trust.",
        serving_tip="Serve it separately.",
        ingredients=ingredients,
        cooking_method="STEAMED",
        causes="The soft texture was hard for the child.",
    )


def drafts(*per_food: list[str]) -> SuggestionsDraft:
    return SuggestionsDraft(
        suggestions=[draft(food.id, items) for food, items in zip(FOODS, per_food, strict=True)]
    )


def text_of(messages) -> str:
    return "\n".join(str(message.content) for message in messages)


async def test_valid_result_is_returned_and_the_prompt_carries_the_context():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀", "tofu"])])

    results = await generate_suggestions(FOODS, CATALOG, llm=llm)

    assert [r.food_id for r in results] == ["f1", "f2"]
    assert results[0].ingredients == ("당근",)
    assert results[0].cooking_method == "STEAMED"
    assert results[0].causes
    assert len(llm.compose_inputs) == 1
    first = llm.compose_inputs[0]
    # 쓸 수 있는 재료 목록과 식후 리뷰 정보는 처음부터 사용자 메시지에 담긴다.
    user_prompt = next(m.content for m in first if isinstance(m, HumanMessage))
    assert "쓸 수 있는 재료" in user_prompt
    for name in ("당근", "쌀", "Tofu"):
        assert name in user_prompt
    assert "outcome: UNTOUCHED" in user_prompt
    assert "difficulty_reasons: TEXTURE.HARDNESS.SOFT, COLOR.GREEN" in user_prompt
    assert "ingredients: 브로콜리" in user_prompt


async def test_prompt_lists_only_the_usable_ingredients():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"])])

    await generate_suggestions(FOODS, build_catalog(["당근", "쌀"]), llm=llm)

    user_prompt = next(m.content for m in llm.compose_inputs[0] if isinstance(m, HumanMessage))
    listed = user_prompt.split("쓸 수 있는 재료 (한 줄에 하나):\n")[1].splitlines()
    assert listed == ["당근", "쌀"]


async def test_invalid_result_is_retried_with_feedback():
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["쌀"]), drafts(["당근"], ["쌀"])])

    results = await generate_suggestions(FOODS, CATALOG, llm=llm)

    assert results[0].ingredients == ("당근",)
    assert len(llm.compose_inputs) == 2
    retry_message = llm.compose_inputs[1][-1]
    assert isinstance(retry_message, HumanMessage)
    assert "땅콩버터" in retry_message.content and "목록에 없습니다" in retry_message.content
    # 첫 시도에는 재시도 지시문이 없다.
    assert "땅콩버터" not in text_of(llm.compose_inputs[0][-1:])


async def test_rejected_after_attempts_are_exhausted():
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["쌀"])] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, CATALOG, llm=llm)

    assert len(llm.compose_inputs) == MAX_ATTEMPTS
    assert [(p.kind, p.food_id, p.ingredient) for p in raised.value.problems] == [
        ("unavailable_ingredient", "f1", "땅콩버터")
    ]


async def test_missing_food_is_rejected():
    only_first = SuggestionsDraft(suggestions=[draft("f1", ["당근"])])
    llm = ScriptedChatModel(drafts=[only_first] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, CATALOG, llm=llm)

    assert [(p.kind, p.food_id) for p in raised.value.problems] == [("missing_food", "f2")]
