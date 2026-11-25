# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 쓸 수 있는 재료 목록, causes·cooking_method 필드 기준으로 재작성
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 추천 생성 조리법 열 가지와 출력 스키마 검증
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 추천 개수와 같은 응답·지난 추천과 겹치는 음식 검사 기준으로 재작성
"""생성 결과 검증 (`validation.py`) 단위 테스트. 그래프 없이 값만으로 확인한다."""

import pytest

from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.validation import ValidationProblem, find_problems
from app.features.suggestions.workflow.state import GeneratedSuggestion, PastRecommendation

CATALOG = build_catalog(["당근", "쌀", "Tofu"])


def suggestion(what_to_try: str, **overrides) -> GeneratedSuggestion:
    values = {
        "what_to_try": what_to_try,
        "why_this_may_help": "익숙한 쌀과 비슷하다",
        "ingredients": ("당근", "쌀"),
        "preparation_method": "작게 잘라 따로 담아 준다",
    }
    return GeneratedSuggestion(**{**values, **overrides})


def check(results, *, count: int | None = None, history=()) -> list[ValidationProblem]:
    return find_problems(
        results,
        count=len(results) if count is None else count,
        history=history,
        catalog=CATALOG,
    )


def kinds(problems: list[ValidationProblem]) -> list[str]:
    return [p.kind for p in problems]


def test_valid_results_have_no_problems():
    assert check([suggestion("Carrot rice"), suggestion("Tofu bowl")]) == []


@pytest.mark.parametrize("received", [2, 4])
def test_wrong_number_of_suggestions(received):
    results = [suggestion(f"Dish {index}") for index in range(received)]
    assert check(results, count=3) == [ValidationProblem(kind="wrong_count", count=received)]


def test_same_food_twice_in_one_answer_ignoring_case_and_spaces():
    results = [suggestion("Carrot rice"), suggestion("  carrot   RICE ")]
    assert check(results) == [ValidationProblem(kind="duplicate_food", position=1)]


def test_food_recommended_before_is_repeated_whatever_its_status():
    history = (
        PastRecommendation("Carrot rice", "DISMISSED", ("DISLIKE",)),
        PastRecommendation("Tofu bowl", "SAVED"),
    )
    results = [suggestion("carrot rice"), suggestion("Rice cake"), suggestion("TOFU bowl")]
    assert check(results, history=history) == [
        ValidationProblem(kind="repeated_food", position=0),
        ValidationProblem(kind="repeated_food", position=2),
    ]


@pytest.mark.parametrize("field", ["what_to_try", "why_this_may_help", "preparation_method"])
@pytest.mark.parametrize("value", ["", "   ", "\t\n"], ids=["empty", "spaces", "whitespace"])
def test_blank_text_field(field, value):
    blank = suggestion(**{"what_to_try": "Carrot rice", field: value})
    assert check([blank, suggestion("Tofu bowl")]) == [
        ValidationProblem(kind="blank_field", position=0, field=field)
    ]


def test_ingredient_names_match_ignoring_case_and_spaces():
    assert check([suggestion("Tofu bowl", ingredients=("tofu", " 당근 "))]) == []


def test_empty_ingredients():
    results = [suggestion("Carrot rice", ingredients=()), suggestion("Tofu", ingredients=(" ",))]
    assert check(results) == [
        ValidationProblem(kind="empty_ingredients", position=0),
        ValidationProblem(kind="empty_ingredients", position=1),
    ]


def test_ingredient_outside_the_usable_list_is_unavailable():
    # 쓸 수 없는 재료와 모르는 재료를 구분하지 않는다. 목록에 없으면 모두 같은 문제다.
    results = [suggestion("Mix", ingredients=("당근", "땅콩버터", "dragon fruit"))]
    assert check(results) == [
        ValidationProblem(kind="unavailable_ingredient", position=0, ingredient="땅콩버터"),
        ValidationProblem(kind="unavailable_ingredient", position=0, ingredient="dragon fruit"),
    ]


def test_translated_ingredient_name_is_rejected():
    assert kinds(check([suggestion("Carrot", ingredients=("carrot",))])) == [
        "unavailable_ingredient"
    ]


def test_multiple_problems_are_all_reported():
    results = [suggestion("", ingredients=("almond-ish",))]
    assert sorted(kinds(check(results, count=3))) == [
        "blank_field",
        "unavailable_ingredient",
        "wrong_count",
    ]
