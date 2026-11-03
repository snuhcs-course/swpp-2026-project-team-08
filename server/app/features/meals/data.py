# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 식사 저장·리뷰 입력을 새 ORM(음식별 재료, 음식 안 리뷰 결과) 기준으로 재작성

"""HTTP 계층이 검증한 식사 데이터를 서비스로 넘기는 값 객체."""

from dataclasses import dataclass
from datetime import date

from app.models.meal_enums import EatingOutcome, MealCookingMethod, MealSetting, MealType


@dataclass(frozen=True)
class IngredientData:
    """사용자가 입력한 재료 이름. id 는 서버가 발급하므로 받지 않는다."""

    name: str


@dataclass(frozen=True)
class FoodData:
    """식사 안의 음식 입력.

    `id` 는 식사를 수정할 때 기존 음식을 가리킨다. 새 음식이면 None 이다.
    `food_recommendation_ids` 는 식사를 처음 저장할 때 이 음식으로 시도한 추천이다.
    """

    id: int | None
    name: str
    ingredients: list[IngredientData]
    cooking_method: MealCookingMethod | None
    serving_note: str | None
    acceptance: int | None
    food_recommendation_ids: list[int]


@dataclass(frozen=True)
class MealData:
    meal_date: date
    meal_type: MealType
    setting: MealSetting
    before_photo_uri: str | None
    foods: list[FoodData]


@dataclass(frozen=True)
class IngredientReviewData:
    ingredient_id: int
    outcome: EatingOutcome | None
    difficulty_reasons: list[str]


@dataclass(frozen=True)
class FoodReviewData:
    food_id: int
    outcome: EatingOutcome
    difficulty_reasons: list[str]
    ingredient_outcomes: list[IngredientReviewData]


@dataclass(frozen=True)
class ReviewData:
    after_photo_uri: str | None
    food_results: list[FoodReviewData]
