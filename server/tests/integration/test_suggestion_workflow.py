# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 없이 프롬프트의 재료 목록으로 검증하는 워크플로 기준으로 재작성
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 재료별 리뷰 결과와 아이가 잘 먹는 음식이 프롬프트에 담기는지 검증 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 코드 대신 설명으로 푼 프롬프트와 재료 목록 구분자 검증
"""제안 생성 워크플로 테스트. 가짜 모델로 그래프 전체를 실행하고 LLM은 호출하지 않는다."""

import pytest
from langchain_core.messages import HumanMessage, SystemMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import (
    FamiliarEatenFood,
    FamiliarFoods,
    FamiliarSafeFood,
    FoodInput,
    IngredientResult,
)
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
CATALOG_HEADING = "쓸 수 있는 재료 (세미콜론 ';'으로 구분, 이름 안의 쉼표는 이름의 일부):\n"


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
    assert "outcome: 입에 대지 않았다" in user_prompt
    assert "UNTOUCHED" not in user_prompt
    # 이유 코드는 그대로 던지지 않고 설명으로 풀어 쓴다.
    assert "difficulty_reasons: 식감이 무르고 부드러워서 / 색이 초록색이어서" in user_prompt
    assert "TEXTURE.HARDNESS" not in user_prompt and "COLOR.GREEN" not in user_prompt
    assert "ingredients: 브로콜리" in user_prompt


async def test_prompt_lists_only_the_usable_ingredients():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"])])

    await generate_suggestions(FOODS, build_catalog(["당근", "쌀"]), llm=llm)

    user_prompt = next(m.content for m in llm.compose_inputs[0] if isinstance(m, HumanMessage))
    assert user_prompt.split(CATALOG_HEADING)[1] == "당근; 쌀"


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


FAMILIAR = FamiliarFoods(
    safe_foods=(
        FamiliarSafeFood("감자", preparation="푹 삶기", presentation_note="작게 잘라 제공"),
        FamiliarSafeFood("쌀밥"),
    ),
    eaten_foods=(
        FamiliarEatenFood("계란찜", cooking_method="STEAMED", ingredients=("달걀", "물")),
        FamiliarEatenFood("바나나"),
    ),
)


def prompt_of(llm: ScriptedChatModel) -> str:
    return next(m.content for m in llm.compose_inputs[0] if isinstance(m, HumanMessage))


async def test_prompt_carries_the_foods_the_child_eats_well():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"])])

    await generate_suggestions(FOODS, CATALOG, familiar=FAMILIAR, llm=llm)

    prompt = prompt_of(llm)
    assert "아이가 평소 잘 먹는 음식 (보호자가 적은 safe food):" in prompt
    assert "- 감자, cooking: 푹 삶기, note: 작게 잘라 제공" in prompt
    # 조리·제공 형태를 적지 않은 safe food 는 이름만 나온다.
    assert "\n- 쌀밥\n" in prompt
    assert "과거 식사에서 아이가 잘 먹은 음식 (식후 리뷰에 '잘 먹었다'로 기록):" in prompt
    assert "- 계란찜, cooking_method: 찌기, ingredients: 달걀, 물" in prompt
    assert "\n- 바나나\n" in prompt
    # 쓸 수 있는 재료 목록은 여전히 마지막 구역이다.
    assert prompt.split(CATALOG_HEADING)[1] == "Tofu; 당근; 쌀"


async def test_prompt_has_no_familiar_sections_without_records():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"])])

    await generate_suggestions(FOODS, CATALOG, llm=llm)

    prompt = prompt_of(llm)
    assert "아이가 평소 잘 먹는 음식" not in prompt
    assert "과거 식사에서 아이가 먹은 음식" not in prompt


async def test_prompt_separates_reasons_for_the_food_and_for_its_ingredients():
    foods = [
        FoodInput(
            id="f1",
            name="Stir fry",
            outcome="UNTOUCHED",
            difficulty_reasons=("TEXTURE.HARDNESS.HARD",),
            ingredient_results=(
                IngredientResult("당근", "UNTOUCHED", ("SMELL.SULFUR", "COLOR.GREEN")),
                IngredientResult("감자", "EATEN"),
            ),
        )
    ]
    llm = ScriptedChatModel(drafts=[SuggestionsDraft(suggestions=[draft("f1", ["당근"])])])

    await generate_suggestions(foods, CATALOG, llm=llm)

    assert (
        "difficulty_reasons: 식감이 딱딱하고 단단해서, ingredient_results: "
        "당근 (outcome: 입에 대지 않았다, difficulty_reasons: "
        "달걀·양배추류 같은 유황 냄새가 나서 / 색이 초록색이어서); "
        "감자 (outcome: 잘 먹었다)"
    ) in prompt_of(llm)


async def test_system_prompt_tells_the_model_how_to_use_reasons_and_familiar_foods():
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"])])

    await generate_suggestions(FOODS, CATALOG, familiar=FAMILIAR, llm=llm)

    system = next(m.content for m in llm.compose_inputs[0] if isinstance(m, SystemMessage))
    # 입력은 아이가 잘 먹지 못한 음식이고, 방향은 잘 먹는 음식 쪽으로 다가가는 것이다.
    assert "아이가 잘 먹지 못한 음식" in system
    # 쓸 수 있는 재료로 만들 수 있는 음식만 제안하고, 들어가는 재료는 빠짐없이 쓴다.
    assert "목록에 있는 재료로 만들 수 있는 음식만 제안합니다" in system
    assert "빠짐없이 모두 씁니다" in system
    assert "못 먹은 음식에서 아이가 잘 먹는 음식 쪽으로" in system
    assert "어느 정도 먹었는지를 문장으로 적은 것" in system
    assert "UNTOUCHED" not in system and "UNCLEAR" not in system
    # 어려워한 이유를 출발점으로 삼고, 기록에 없는 이유를 지어내지 않는다.
    assert "어려워한 이유는 제안의 출발점" in system
    assert "지어내지 않습니다" in system
    # 익숙한 음식은 제안의 근거일 뿐이고 재료는 여전히 쓸 수 있는 재료 목록에서만 고른다.
    assert "이름이 같다고 해서" in system
    assert "재료를 고르는 기준이 아닙니다" in system


async def test_missing_food_is_rejected():
    only_first = SuggestionsDraft(suggestions=[draft("f1", ["당근"])])
    llm = ScriptedChatModel(drafts=[only_first] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions(FOODS, CATALOG, llm=llm)

    assert [(p.kind, p.food_id) for p in raised.value.problems] == [("missing_food", "f2")]
