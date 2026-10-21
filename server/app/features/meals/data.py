"""Validated meal data passed from HTTP to the meal service."""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class IngredientData:
    id: str | None
    name: str


@dataclass(frozen=True)
class FoodData:
    id: str
    name: str
    ingredients: list[IngredientData]
    cooking_method: str | None
    serving_note: str | None
    acceptance: int | None


@dataclass(frozen=True)
class SuggestionLinkData:
    suggestion_id: str
    food_id: str
    ingredient_id: str | None


@dataclass(frozen=True)
class MealData:
    meal_date: date
    meal_type: str
    setting: str
    before_photo_uri: str | None
    foods: list[FoodData]
    suggestion_links: list[SuggestionLinkData]
