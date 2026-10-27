# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""제안 생성 워크플로 테스트. 가짜 모델로 그래프 전체를 실행하고 LLM은 호출하지 않는다."""

import pytest
from langchain_core.messages import HumanMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import (
    ChildContext,
    Difficulty,
    FoodInput,
    SafeFoodInfo,
)
from tests.helpers.fake_chat_model import ScriptedChatModel

FOODS = [FoodInput(id="f1", name="Broccoli"), FoodInput(id="f2", name="Egg")]
RESTRICTIONS = ChildRestrictions(ids=frozenset({RestrictionId.PEANUT}))
CHILD = ChildContext()


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


def text_of(messages) -> str:
    return "\n".join(str(message.content) for message in messages)


async def test_valid_result_is_returned():
    llm = ScriptedChatModel(drafts=[drafts(["carrot"], ["rice"])])

    results = await generate_suggestions(FOODS, RESTRICTIONS, CHILD, llm=llm)

    assert [r.food_id for r in results] == ["f1", "f2"]
    assert results[0].used_ingredients == ("carrot",)
    assert len(llm.compose_inputs) == 1


async def test_prompt_lists_usable_ingredients_child_info_and_targets():
    child = ChildContext(
        age_group="4-5",
        difficult_textures=("slimy",),
        other_restrictions=("kiwi-like fruit",),
        safe_foods=(SafeFoodInfo(name="Plain rice", preparation="steamed"),),
        refused_foods=("Spinach soup",),
        refused_ingredients=("Mushroom",),
    )
    foods = [
        FoodInput(
            id="0",
            name="Carrot stir-fry",
            ingredients=("Carrot", "Potato"),
            cooking_method="stir_fried",
            outcome="untouched",
            difficulties=(Difficulty("texture", "hardness", "hard"),),
        ),
        FoodInput(id="1", name="Carrot", parent_food="Carrot stir-fry"),
    ]
    llm = ScriptedChatModel(
        drafts=[
            SuggestionsDraft(suggestions=[draft("0", ["carrot"]), draft("1", ["carrot"])]),
        ]
    )

    await generate_suggestions(foods, RESTRICTIONS, child, llm=llm)

    prompt = text_of(llm.compose_inputs[0])
    for expected in (
        "Plain rice",
        "steamed",
        "Spinach soup",
        "Mushroom",
        "slimy",
        "kiwi-like fruit",
        "Carrot stir-fry",
        "stir_fried",
        "hardness/hard",
        "들어 있던 음식: Carrot stir-fry",
    ):
        assert expected in prompt
    # 땅콩 제한이 있는 아이의 목록에는 땅콩 재료가 없고, 쓸 수 있는 재료는 들어 있다.
    usable_section = prompt.split("[쓸 수 있는 재료")[1]
    assert "carrot" in usable_section
    assert "peanut butter" not in usable_section.lower()


async def test_invalid_result_is_retried_with_feedback():
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["rice"]), drafts(["carrot"], ["rice"])])

    results = await generate_suggestions(FOODS, RESTRICTIONS, CHILD, llm=llm)

    assert results[0].used_ingredients == ("carrot",)
    assert len(llm.compose_inputs) == 2
    retry_message = llm.compose_inputs[1][-1]
    assert isinstance(retry_message, HumanMessage)
    assert "땅콩버터" in retry_message.content and "peanut" in retry_message.content
    # 첫 시도에는 재시도 지시문이 없다.
    assert "땅콩버터" not in text_of(llm.compose_inputs[0][-1:])


async def test_rejected_after_attempts_are_exhausted():
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["rice"])] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, RESTRICTIONS, CHILD, llm=llm)

    assert len(llm.compose_inputs) == MAX_ATTEMPTS
    assert [(p.kind, p.food_id, p.ingredient) for p in raised.value.problems] == [
        ("restricted_ingredient", "f1", "땅콩버터")
    ]


async def test_missing_food_is_rejected():
    only_first = SuggestionsDraft(suggestions=[draft("f1", ["carrot"])])
    llm = ScriptedChatModel(drafts=[only_first] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, RESTRICTIONS, CHILD, llm=llm)

    assert [(p.kind, p.food_id) for p in raised.value.problems] == [("missing_food", "f2")]
