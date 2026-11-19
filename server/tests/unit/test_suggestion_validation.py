# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 쓸 수 있는 재료 목록, causes·cooking_method 필드 기준으로 재작성
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 추천 생성 조리법 열 가지와 출력 스키마 검증
"""생성 결과 검증 (`validation.py`) 단위 테스트. 그래프 없이 값만으로 확인한다."""

import pytest
from pydantic import ValidationError

from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.validation import ValidationProblem, find_problems
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from app.models.meal_enums import MealCookingMethod
from tests.helpers.suggestions import suggestion_draft

FOODS = [FoodInput(id="f1", name="Broccoli"), FoodInput(id="f2", name="Egg")]
CATALOG = build_catalog(["당근", "쌀", "Tofu"])


def suggestion(food_id: str, **overrides) -> GeneratedSuggestion:
    values = {
        "food_id": food_id,
        "what_to_try": "조금씩 맛보기",
        "why_this_may_help": "익숙해질 시간을 준다",
        "serving_tip": "따로 담아 준다",
        "ingredients": ("당근", "쌀"),
        "cooking_method": MealCookingMethod.STEAMED,
        "causes": "질감이 어려웠다",
    }
    return GeneratedSuggestion(**{**values, **overrides})


def kinds(problems: list[ValidationProblem]) -> list[str]:
    return [p.kind for p in problems]


def test_valid_results_have_no_problems():
    results = [suggestion("f1"), suggestion("f2")]
    assert find_problems(FOODS, results, CATALOG) == []


def test_추천_출력_스키마는_현재_조리법_열_가지를_제시한다():
    expected = [
        "RAW",
        "BOILED",
        "STEAMED",
        "PAN_FRIED",
        "STIR_FRIED",
        "BAKED",
        "ROASTED",
        "MASHED",
        "BLENDED",
        "OTHER",
    ]
    schema = SuggestionDraft.model_json_schema()
    assert schema["properties"]["cooking_method"]["enum"] == expected
    drafts = SuggestionsDraft(
        suggestions=[
            suggestion_draft(str(index), cooking_method=method)
            for index, method in enumerate(expected)
        ]
    )
    assert [item.cooking_method.value for item in drafts.to_generated()] == expected


@pytest.mark.parametrize(
    "method",
    [None, "BAKED_ROASTED", "MASHED_BLENDED", "steamed", "UNKNOWN", 1],
    ids=["미입력", "굽기_통합값", "으깨기_통합값", "소문자", "미지원값", "숫자"],
)
def test_추천_생성은_허용_목록과_맞지_않는_조리법을_거절한다(method):
    with pytest.raises(ValidationError):
        suggestion_draft(cooking_method=method)


def test_ingredient_names_match_ignoring_case_and_spaces():
    results = [suggestion("f1", ingredients=("tofu", " 당근 ")), suggestion("f2")]
    assert find_problems(FOODS, results, CATALOG) == []


def test_missing_unexpected_and_duplicate_foods():
    results = [suggestion("f1"), suggestion("f1"), suggestion("zzz")]
    problems = find_problems(FOODS, results, CATALOG)
    assert sorted((p.kind, p.food_id) for p in problems) == [
        ("duplicate_food", "f1"),
        ("missing_food", "f2"),
        ("unexpected_food", "zzz"),
    ]


@pytest.mark.parametrize("field", ["what_to_try", "why_this_may_help", "serving_tip", "causes"])
@pytest.mark.parametrize("value", ["", "   ", "\t\n"], ids=["empty", "spaces", "whitespace"])
def test_blank_text_field(field, value):
    results = [suggestion("f1", **{field: value}), suggestion("f2")]
    assert find_problems(FOODS, results, CATALOG) == [
        ValidationProblem(kind="blank_field", food_id="f1", field=field)
    ]


def test_empty_ingredients():
    results = [suggestion("f1", ingredients=()), suggestion("f2", ingredients=(" ",))]
    assert kinds(find_problems(FOODS, results, CATALOG)) == [
        "empty_ingredients",
        "empty_ingredients",
    ]


def test_ingredient_outside_the_usable_list_is_unavailable():
    # 쓸 수 없는 재료와 모르는 재료를 구분하지 않는다. 목록에 없으면 모두 같은 문제다.
    results = [suggestion("f1", ingredients=("당근", "땅콩버터", "dragon fruit")), suggestion("f2")]
    assert find_problems(FOODS, results, CATALOG) == [
        ValidationProblem(kind="unavailable_ingredient", food_id="f1", ingredient="땅콩버터"),
        ValidationProblem(kind="unavailable_ingredient", food_id="f1", ingredient="dragon fruit"),
    ]


def test_translated_ingredient_name_is_rejected():
    results = [suggestion("f1", ingredients=("carrot",)), suggestion("f2")]
    assert kinds(find_problems(FOODS, results, CATALOG)) == ["unavailable_ingredient"]


def test_multiple_problems_are_all_reported():
    results = [suggestion("f1", what_to_try="", ingredients=("almond-ish",))]
    assert sorted(kinds(find_problems(FOODS, results, CATALOG))) == [
        "blank_field",
        "missing_food",
        "unavailable_ingredient",
    ]
