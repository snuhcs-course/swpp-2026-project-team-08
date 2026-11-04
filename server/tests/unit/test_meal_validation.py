# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 대문자 enum, 서버 발급 id, 난이도 사유 문자열 기준으로 DTO 검증 테스트 재작성
"""Unit: meal DTO ranges and normalization. No DB or HTTP mocks needed."""

import pytest
from pydantic import ValidationError

from app.features.meals.dto import (
    FoodReviewInput,
    IngredientInput,
    MealFoodCreateRequest,
    MealFoodsWriteRequest,
    MealFoodUpdateRequest,
    MealWriteRequest,
)
from app.models.difficulty_enums import DifficultyReason
from app.models.meal_enums import MealCookingMethod, MealSetting, MealType


def _food(**fields) -> dict:
    return {"name": "Rice", "ingredients": [], **fields}


@pytest.mark.parametrize("value", [None, 0, 1, 2, 3], ids=["absent", "min", "one", "two", "max"])
def test_acceptance_accepts_supported_values(value):
    assert MealFoodCreateRequest(**_food(acceptance=value)).acceptance == value


@pytest.mark.parametrize(
    "value", [-1, 4, True, "1", 1.5], ids=["below", "above", "boolean", "text", "fraction"]
)
def test_acceptance_rejects_out_of_range_and_wrong_types(value):
    with pytest.raises(ValidationError):
        MealFoodCreateRequest(**_food(acceptance=value))


@pytest.mark.parametrize("method", [item.value for item in MealCookingMethod])
def test_cooking_method_accepts_every_uppercase_value(method):
    assert MealFoodCreateRequest(**_food(cooking_method=method)).cooking_method == method


@pytest.mark.parametrize("method", ["stir_fried", "Boiled", "FRYING", ""])
def test_cooking_method_rejects_other_values(method):
    with pytest.raises(ValidationError):
        MealFoodCreateRequest(**_food(cooking_method=method))


@pytest.mark.parametrize(
    "value", ["1", "42", "9223372036854775807"], ids=["minimum", "middle", "maximum"]
)
def test_existing_food_id_accepts_positive_bigint_strings(value):
    assert MealFoodUpdateRequest(**_food(id=value)).id == value


@pytest.mark.parametrize(
    "value",
    ["0", "-1", "01", "9223372036854775808", "1.5", "１", ""],
    ids=["zero", "negative", "leading-zero", "overflow", "fraction", "non-ascii", "empty"],
)
def test_existing_food_id_rejects_invalid_bigint_strings(value):
    with pytest.raises(ValidationError):
        MealFoodUpdateRequest(**_food(id=value))


def test_new_food_has_no_id_and_creation_rejects_one():
    assert MealFoodUpdateRequest(**_food()).id is None
    with pytest.raises(ValidationError):
        MealFoodCreateRequest(**_food(id="1"))


@pytest.mark.parametrize(
    "value,expected",
    [("rice", "rice"), ("  Brown   Rice  ", "Brown Rice"), ("감자\t볶음", "감자 볶음")],
)
def test_ingredient_name_normalizes_whitespace(value, expected):
    assert IngredientInput(name=value).name == expected


@pytest.mark.parametrize("value", ["", "   ", "\t\n"])
def test_ingredient_name_rejects_blank_values(value):
    with pytest.raises(ValidationError):
        IngredientInput(name=value)


def test_ingredient_rejects_client_id():
    with pytest.raises(ValidationError):
        IngredientInput(name="rice", id="1")


@pytest.mark.parametrize(
    "meal_type,setting",
    [("BREAKFAST", "HOME"), ("LUNCH", "SCHOOL"), ("DINNER", "RESTAURANT"), ("SNACK", "OTHERS")],
)
def test_meal_accepts_supported_type_and_setting(meal_type, setting):
    request = MealWriteRequest(
        meal_date="2024-02-29",
        meal_type=meal_type,
        setting=setting,
        foods=[_food()],
    )
    assert request.meal_type == MealType(meal_type)
    assert request.setting == MealSetting(setting)
    assert request.meal_date.isoformat() == "2024-02-29"


@pytest.mark.parametrize(
    "meal_type,setting",
    [("lunch", "HOME"), ("LUNCH", "home"), ("BRUNCH", "HOME"), ("LUNCH", "CAFE")],
    ids=["lowercase-type", "lowercase-setting", "unknown-type", "unknown-setting"],
)
def test_meal_rejects_old_or_unknown_type_and_setting(meal_type, setting):
    with pytest.raises(ValidationError):
        MealWriteRequest(
            meal_date="2026-10-23", meal_type=meal_type, setting=setting, foods=[_food()]
        )


def test_meal_rejects_empty_foods():
    with pytest.raises(ValidationError):
        MealWriteRequest(meal_date="2026-10-23", meal_type="LUNCH", setting="HOME", foods=[])


def test_meal_rejects_the_old_suggestion_links_field():
    with pytest.raises(ValidationError):
        MealWriteRequest(
            meal_date="2026-10-23",
            meal_type="LUNCH",
            setting="HOME",
            foods=[_food()],
            suggestion_links=[],
        )


def test_recommendation_ids_are_per_food_and_unique_within_the_meal():
    request = MealWriteRequest(
        meal_date="2026-10-23",
        meal_type="LUNCH",
        setting="HOME",
        foods=[_food(food_recommendation_ids=["3"]), _food(food_recommendation_ids=["4"])],
    )
    assert [food.food_recommendation_ids for food in request.foods] == [["3"], ["4"]]
    for foods in (
        [_food(food_recommendation_ids=["3", "3"])],
        [_food(food_recommendation_ids=["3"]), _food(food_recommendation_ids=["3"])],
    ):
        with pytest.raises(ValidationError):
            MealWriteRequest(meal_date="2026-10-23", meal_type="LUNCH", setting="HOME", foods=foods)


def test_recommendation_id_must_be_a_bigint_string():
    for value in ("0", "abc", "9223372036854775808"):
        with pytest.raises(ValidationError):
            MealFoodCreateRequest(**_food(food_recommendation_ids=[value]))


def test_update_rejects_empty_foods_and_duplicate_ids():
    assert len(MealFoodsWriteRequest(foods=[_food(), _food()]).foods) == 2
    with pytest.raises(ValidationError):
        MealFoodsWriteRequest(foods=[])
    with pytest.raises(ValidationError):
        MealFoodsWriteRequest(foods=[_food(id="1"), _food(id="1")])


def test_difficulty_reasons_accept_every_defined_value():
    reasons = [item.value for item in DifficultyReason]
    assert len(reasons) == 77
    parsed = FoodReviewInput(food_id="1", outcome="EATEN", difficulty_reasons=reasons)
    assert [item.value for item in parsed.difficulty_reasons] == reasons


@pytest.mark.parametrize(
    "reasons",
    [
        ["texture.hardness.soft"],
        ["TEXTURE.HARDNESS"],
        ["TASTE.INTENSITY.MILD"],
        ["COLOR.RED", "COLOR.RED"],
        [{"category": "texture", "subcategory": "hardness", "value": "soft"}],
    ],
    ids=["lowercase", "category-only", "removed-value", "duplicate", "old-object"],
)
def test_difficulty_reasons_reject_unknown_or_duplicate_values(reasons):
    with pytest.raises(ValidationError):
        FoodReviewInput(food_id="1", outcome="EATEN", difficulty_reasons=reasons)


@pytest.mark.parametrize("outcome", [None, "eaten", "ATE", ""])
def test_food_review_requires_an_uppercase_outcome(outcome):
    with pytest.raises(ValidationError):
        FoodReviewInput(food_id="1", outcome=outcome)
