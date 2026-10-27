# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Unit: meal DTO ranges and normalization. No DB or HTTP mocks needed."""

import pytest
from pydantic import ValidationError

from app.features.meals.dto import FoodWriteRequest, IngredientInput, MealWriteRequest


@pytest.mark.parametrize("value", [None, 0, 1, 2, 3], ids=["absent", "min", "one", "two", "max"])
def test_acceptance_accepts_supported_values(value):
    assert (
        FoodWriteRequest(id="1", name="Rice", ingredients=[], acceptance=value).acceptance == value
    )


@pytest.mark.parametrize(
    "value", [-1, 4, True, "1", 1.5], ids=["below", "above", "boolean", "text", "fraction"]
)
def test_acceptance_rejects_out_of_range_and_wrong_types(value):
    with pytest.raises(ValidationError):
        FoodWriteRequest(id="1", name="Rice", ingredients=[], acceptance=value)


@pytest.mark.parametrize(
    "value", ["1", "42", "9223372036854775807"], ids=["minimum", "middle", "maximum"]
)
def test_food_id_accepts_positive_bigint_strings(value):
    assert FoodWriteRequest(id=value, name="Rice", ingredients=[]).id == value


@pytest.mark.parametrize(
    "value",
    ["0", "-1", "01", "9223372036854775808", "1.5", "１", ""],
    ids=["zero", "negative", "leading-zero", "overflow", "fraction", "non-ascii", "empty"],
)
def test_food_id_rejects_invalid_bigint_strings(value):
    with pytest.raises(ValidationError):
        FoodWriteRequest(id=value, name="Rice", ingredients=[])


@pytest.mark.parametrize(
    "value,expected",
    [("rice", "rice"), ("  Brown   Rice  ", "Brown Rice"), ("감자\t볶음", "감자 볶음")],
)
def test_ingredient_name_normalizes_whitespace(value, expected):
    assert IngredientInput(name=value).name == expected


@pytest.mark.parametrize(
    "meal_type,setting",
    [("breakfast", "home"), ("lunch", "school"), ("dinner", "restaurant"), ("snack", "others")],
)
def test_meal_accepts_supported_type_and_setting(meal_type, setting):
    request = MealWriteRequest(
        meal_date="2024-02-29",
        meal_type=meal_type,
        setting=setting,
        foods=[{"id": "1", "name": "Rice", "ingredients": []}],
    )
    assert request.meal_type == meal_type
    assert request.setting == setting
    assert request.meal_date.isoformat() == "2024-02-29"


@pytest.mark.parametrize(
    "foods",
    [
        [],
        [
            {"id": "1", "name": "Rice", "ingredients": []},
            {"id": "1", "name": "Soup", "ingredients": []},
        ],
    ],
    ids=["empty", "duplicate-id"],
)
def test_meal_rejects_empty_or_duplicate_foods(foods):
    with pytest.raises(ValidationError):
        MealWriteRequest(meal_date="2026-10-23", meal_type="lunch", setting="home", foods=foods)
