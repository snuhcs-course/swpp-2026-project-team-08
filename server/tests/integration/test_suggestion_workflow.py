# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 없이 프롬프트의 재료 목록으로 검증하는 워크플로 기준으로 재작성
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 재료별 리뷰 결과와 아이가 잘 먹는 음식이 프롬프트에 담기는지 검증 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 코드 대신 설명으로 푼 프롬프트와 재료 목록 구분자 검증
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 연령대·편식 가설·추천 이력으로 음식을 추천하는 워크플로 기준으로 재작성
"""추천 생성 워크플로 테스트. 가짜 모델로 그래프 전체를 실행하고 LLM은 호출하지 않는다."""

import pytest
from langchain_core.messages import HumanMessage, SystemMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionsDraft
from app.features.suggestions.workflow.state import (
    DifficultFood,
    FamiliarEatenFood,
    FamiliarFoods,
    FamiliarSafeFood,
    IngredientResult,
    PastRecommendation,
)
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.suggestions import suggestion_draft

CATALOG = build_catalog(["당근", "쌀", "Tofu"])
CATALOG_HEADING = "쓸 수 있는 재료 (세미콜론 ';'으로 구분, 이름 안의 쉼표는 이름의 일부):\n"
DIFFICULT_FOODS = (
    DifficultFood(
        name="Broccoli",
        outcome="UNTOUCHED",
        ingredients=("브로콜리",),
        cooking_method="STEAMED",
        difficulty_reasons=("TEXTURE.HARDNESS.SOFT", "COLOR.GREEN"),
    ),
)
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
HISTORY = (
    PastRecommendation("Carrot rice", "DISMISSED", ("TOO_MUCH_PREPARATION", "DISLIKE")),
    PastRecommendation("Tofu bowl", "SAVED"),
)


def drafts(*items: tuple[str, list[str]]) -> SuggestionsDraft:
    """(음식 이름, 재료) 쌍마다 초안 하나를 담은 묶음."""
    return SuggestionsDraft(
        suggestions=[suggestion_draft(name, ingredients=ingredients) for name, ingredients in items]
    )


VALID = drafts(("Rice porridge", ["쌀"]), ("Carrot mash", ["당근"]))


async def generate(llm: ScriptedChatModel, **inputs):
    values = {"count": 2, "age_group": "AGE_4_5", "catalog": CATALOG, **inputs}
    return await generate_suggestions(**values, llm=llm)


def user_prompt(llm: ScriptedChatModel) -> str:
    return next(m.content for m in llm.compose_inputs[0] if isinstance(m, HumanMessage))


async def test_valid_result_is_returned():
    llm = ScriptedChatModel(drafts=[VALID])

    results = await generate(llm)

    assert [r.what_to_try for r in results] == ["Rice porridge", "Carrot mash"]
    assert results[0].ingredients == ("쌀",)
    assert results[0].preparation_method
    assert len(llm.compose_inputs) == 1


async def test_prompt_carries_age_difficulties_familiar_foods_and_history():
    llm = ScriptedChatModel(drafts=[VALID])

    await generate(llm, difficult_foods=DIFFICULT_FOODS, familiar=FAMILIAR, history=HISTORY)

    prompt = user_prompt(llm)
    assert prompt.startswith("아이에게 추천할 음식 2개를 만들 것입니다.")
    assert "- 연령대: 만 4~5세" in prompt
    # 잘 먹지 못한 음식과 보호자가 추정한 이유는 코드 대신 설명으로 실린다.
    assert "잘 먹지 못한 음식 (어려워한 이유는 보호자가 추정한 가설):" in prompt
    assert (
        "- name: Broccoli, ingredients: 브로콜리, cooking_method: 찌기, "
        "outcome: 입에 대지 않았다, "
        "difficulty_reasons: 식감이 무르고 부드러워서 / 색이 초록색이어서"
    ) in prompt
    # 아이가 잘 먹는 음식은 기록된 형태와 함께 실린다.
    assert "- 감자, cooking: 푹 삶기, note: 작게 잘라 제공" in prompt
    assert "\n- 쌀밥\n" in prompt
    assert "- 계란찜, cooking_method: 찌기, ingredients: 달걀, 물" in prompt
    # 추천 이력은 결정과 거절 이유를 문장으로 싣는다.
    assert (
        "- Carrot rice, decision: 보호자가 거절했다, "
        "dismiss_reasons: 준비가 너무 번거로워서 / 아이가 싫어할 것 같아서"
    ) in prompt
    assert "- Tofu bowl, decision: 보호자가 저장했다" in prompt
    for code in ("AGE_4_5", "UNTOUCHED", "TEXTURE.HARDNESS", "DISMISSED", "DISLIKE"):
        assert code not in prompt
    # 쓸 수 있는 재료 목록은 항상 마지막 구역이다.
    assert prompt.split(CATALOG_HEADING)[1] == "Tofu; 당근; 쌀"


async def test_prompt_separates_reasons_for_the_food_and_for_its_ingredients():
    foods = (
        DifficultFood(
            name="Stir fry",
            outcome="UNTOUCHED",
            difficulty_reasons=("TEXTURE.HARDNESS.HARD",),
            ingredient_results=(
                IngredientResult("당근", "UNTOUCHED", ("SMELL.SULFUR", "COLOR.GREEN")),
                IngredientResult("감자", "EATEN"),
            ),
        ),
    )
    llm = ScriptedChatModel(drafts=[VALID])

    await generate(llm, difficult_foods=foods)

    assert (
        "difficulty_reasons: 식감이 딱딱하고 단단해서, ingredient_results: "
        "당근 (outcome: 입에 대지 않았다, difficulty_reasons: "
        "달걀·양배추류 같은 유황 냄새가 나서 / 색이 초록색이어서); "
        "감자 (outcome: 잘 먹었다)"
    ) in user_prompt(llm)


async def test_prompt_has_only_the_child_and_catalog_without_records():
    llm = ScriptedChatModel(drafts=[VALID])

    await generate(llm)

    prompt = user_prompt(llm)
    assert "- 연령대: 만 4~5세" in prompt
    for heading in ("잘 먹지 못한 음식", "아이가 평소 잘 먹는 음식", "지금까지 추천한 음식"):
        assert heading not in prompt


async def test_system_prompt_treats_reasons_as_hypotheses():
    llm = ScriptedChatModel(drafts=[VALID])

    await generate(llm)

    system = next(m.content for m in llm.compose_inputs[0] if isinstance(m, SystemMessage))
    assert "편식하지 않고 먹을 가능성이 높은 음식" in system
    # 어려워한 이유는 가설이고, 반복되는 이유를 더 강한 근거로 본다.
    assert "가설이며 사실로 단정하지 않습니다" in system
    assert "여러 음식에서 반복되는 이유" in system
    assert "지어내지 않습니다" in system
    # 연령대, 추천 이력, 거절 이유의 쓰임.
    assert "연령대에 맞는 음식·식감·크기" in system
    assert "같은 음식을 다시 추천하지 않습니다" in system
    assert "식후 반응으로 해석하지 않습니다" in system
    # 기록이 없어도 연령대와 재료만으로 추천한다.
    assert "연령대와 쓸 수 있는 재료만으로" in system
    # 재료는 쓸 수 있는 재료 목록에서만 고른다.
    assert "목록에 있는 재료로 만들 수 있는 음식만 추천합니다" in system
    assert "재료를 고르는 기준이 아닙니다" in system
    assert "UNTOUCHED" not in system and "UNCLEAR" not in system


async def test_invalid_result_is_retried_with_feedback():
    llm = ScriptedChatModel(
        drafts=[drafts(("Peanut toast", ["땅콩버터"]), ("Carrot mash", ["당근"])), VALID]
    )

    results = await generate(llm)

    assert results[0].ingredients == ("쌀",)
    assert len(llm.compose_inputs) == 2
    retry_message = llm.compose_inputs[1][-1]
    assert isinstance(retry_message, HumanMessage)
    assert "추천 1의 재료 '땅콩버터'" in retry_message.content
    assert "목록에 없습니다" in retry_message.content


async def test_repeating_a_past_recommendation_is_retried():
    llm = ScriptedChatModel(drafts=[drafts(("carrot RICE", ["당근"]), ("Tofu", ["Tofu"])), VALID])

    await generate(llm, history=HISTORY)

    retry_message = llm.compose_inputs[1][-1].content
    assert "추천 1의 음식은 지금까지 추천한 음식입니다" in retry_message


async def test_wrong_number_of_suggestions_is_retried():
    llm = ScriptedChatModel(drafts=[drafts(("Rice porridge", ["쌀"])), VALID])

    results = await generate(llm)

    assert len(results) == 2
    assert "추천이 1개입니다" in llm.compose_inputs[1][-1].content


async def test_rejected_after_attempts_are_exhausted():
    invalid = drafts(("Peanut toast", ["땅콩버터"]), ("Carrot mash", ["당근"]))
    llm = ScriptedChatModel(drafts=[invalid] * MAX_ATTEMPTS)

    with pytest.raises(GenerationRejectedError) as raised:
        await generate(llm)

    assert len(llm.compose_inputs) == MAX_ATTEMPTS
    assert [(p.kind, p.position, p.ingredient) for p in raised.value.problems] == [
        ("unavailable_ingredient", 0, "땅콩버터")
    ]
