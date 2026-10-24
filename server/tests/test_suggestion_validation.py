# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""생성 결과 검증 (`validation.py`) 단위 테스트. 그래프 없이 값만으로 확인한다."""

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.validation import ValidationProblem, find_problems
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from tests.suggestion_catalog import CATALOG

FOODS = [FoodInput(id="f1", name="Broccoli"), FoodInput(id="f2", name="Egg")]
RESTRICTIONS = ChildRestrictions(ids=frozenset({RestrictionId.PEANUT, RestrictionId.MILK}))


def suggestion(food_id: str, **overrides) -> GeneratedSuggestion:
    values = {
        "food_id": food_id,
        "what_to_try": "조금씩 맛보기",
        "why_this_may_help": "익숙해질 시간을 준다",
        "serving_tip": "따로 담아 준다",
        "used_ingredients": ("carrot", "rice"),
    }
    return GeneratedSuggestion(**{**values, **overrides})


def kinds(problems: list[ValidationProblem]) -> list[str]:
    return [p.kind for p in problems]


def test_valid_results_have_no_problems():
    results = [suggestion("f1"), suggestion("f2")]
    assert find_problems(FOODS, results, RESTRICTIONS, CATALOG) == []


def test_missing_unexpected_and_duplicate_foods():
    results = [suggestion("f1"), suggestion("f1"), suggestion("zzz")]
    problems = find_problems(FOODS, results, RESTRICTIONS, CATALOG)
    assert sorted((p.kind, p.food_id) for p in problems) == [
        ("duplicate_food", "f1"),
        ("missing_food", "f2"),
        ("unexpected_food", "zzz"),
    ]


def test_blank_text_field():
    results = [suggestion("f1", serving_tip="   "), suggestion("f2")]
    assert find_problems(FOODS, results, RESTRICTIONS, CATALOG) == [
        ValidationProblem(kind="blank_field", food_id="f1", field="serving_tip")
    ]


def test_empty_ingredients():
    results = [suggestion("f1", used_ingredients=()), suggestion("f2", used_ingredients=(" ",))]
    assert kinds(find_problems(FOODS, results, RESTRICTIONS, CATALOG)) == [
        "empty_ingredients",
        "empty_ingredients",
    ]


def test_unknown_ingredient():
    results = [suggestion("f1", used_ingredients=("carrot", "dragon fruit")), suggestion("f2")]
    assert find_problems(FOODS, results, RESTRICTIONS, CATALOG) == [
        ValidationProblem(kind="unknown_ingredient", food_id="f1", ingredient="dragon fruit")
    ]


def test_restricted_ingredient_reports_which_restrictions():
    results = [suggestion("f1", used_ingredients=("땅콩버터", "Cheese")), suggestion("f2")]
    assert find_problems(FOODS, results, RESTRICTIONS, CATALOG) == [
        ValidationProblem(
            kind="restricted_ingredient",
            food_id="f1",
            ingredient="땅콩버터",
            restrictions=("peanut",),
        ),
        ValidationProblem(
            kind="restricted_ingredient",
            food_id="f1",
            ingredient="Cheese",
            restrictions=("milk",),
        ),
    ]


def test_multiple_problems_are_all_reported():
    results = [suggestion("f1", what_to_try="", used_ingredients=("almond-ish",))]
    assert sorted(kinds(find_problems(FOODS, results, RESTRICTIONS, CATALOG))) == [
        "blank_field",
        "missing_food",
        "unknown_ingredient",
    ]
