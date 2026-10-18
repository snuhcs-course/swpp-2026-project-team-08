# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""식사 기록 요청/응답 DTO."""

from datetime import date, datetime
from typing import Any, Literal

# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator

from app.core.errors import AppError
from app.models.food_enums import FoodPreparation

MealType = Literal["breakfast", "lunch", "dinner", "snack"]
MealSetting = Literal["home", "restaurant", "school", "others"]
ReviewStatus = Literal["awaiting_review", "reviewed"]
FoodSource = Literal["ai", "parent"]
OutcomeValue = Literal["eaten", "tasted", "untouched", "unclear"]


class InvalidMealTypeError(AppError):
    def __init__(self, meal_type: str) -> None:
        super().__init__()
        self.meal_type = meal_type


class InvalidMealSettingError(AppError):
    def __init__(self, setting: str) -> None:
        super().__init__()
        self.setting = setting


class EmptyFoodsError(AppError):
    """식사에 음식 항목이 없다."""


class DuplicateFoodIdError(AppError):
    def __init__(self, food_id: str) -> None:
        super().__init__()
        self.food_id = food_id


# ── 요청 ────────────────────────────────────────────


class MealFoodRequest(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    ingredients: list[str]
    cooking_method: FoodPreparation | None = None
    serving_note: str = ""
    traits: dict[str, Any]
    source: FoodSource
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    acceptance: int | None = Field(default=None, ge=0, le=3, strict=True)
    origin: FoodSource | None = None


# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
class SuggestionLinkRequest(BaseModel):
    suggestion_id: str = Field(min_length=1, max_length=80)
    food_id: str = Field(min_length=1, max_length=80)
    title: str
    description: str
    serving_tip: str | None = None


class MealUpsertRequest(BaseModel):
    meal_date: date
    meal_type: str
    setting: str
    before_photo_uri: str | None = None
    suggestion_links: list[SuggestionLinkRequest] = Field(default_factory=list)
    foods: list[MealFoodRequest]
    saved_at: datetime

    @field_validator("meal_type")
    @classmethod
    def _check_meal_type(cls, value: str) -> str:
        if value not in ("breakfast", "lunch", "dinner", "snack"):
            raise InvalidMealTypeError(value)
        return value

    @field_validator("setting")
    @classmethod
    def _check_setting(cls, value: str) -> str:
        if value not in ("home", "restaurant", "school", "others"):
            raise InvalidMealSettingError(value)
        return value

    @field_validator("foods")
    @classmethod
    def _check_foods(cls, value: list[MealFoodRequest]) -> list[MealFoodRequest]:
        if not value:
            raise EmptyFoodsError()
        seen: set[str] = set()
        for food in value:
            if food.id in seen:
                raise DuplicateFoodIdError(food.id)
            seen.add(food.id)
        return value


class OutcomeDecisionRequest(BaseModel):
    confirmed: OutcomeValue | None = None
    suggested: OutcomeValue | None = None


class IngredientOutcomeRequest(BaseModel):
    id: str
    name: str
    decision: OutcomeDecisionRequest


class FoodOutcomeRequest(BaseModel):
    food_id: str
    decision: OutcomeDecisionRequest
    ingredients: list[IngredientOutcomeRequest]


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
class SuggestionFeedback(BaseModel):
    tried: StrictBool


class MealReviewRequest(BaseModel):
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    after_photo_uri: str = ""
    outcomes: list[FoodOutcomeRequest]
    difficulties: dict[str, Any]
    suggestion_feedback: dict[str, SuggestionFeedback] = Field(default_factory=dict)
    saved_at: datetime


class MealSuggestionRequest(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    food_id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=200)
    description: str
    serving_tip: str | None = None
    ingredients: list[str]


# ── 응답 ────────────────────────────────────────────


class MealFoodSummaryResponse(BaseModel):
    name: str
    ingredients: list[str]


class MealListItemResponse(BaseModel):
    id: str
    meal_date: date
    meal_type: str
    setting: str
    before_photo_uri: str | None
    foods: list[MealFoodSummaryResponse]
    review_status: ReviewStatus


class CalendarDayResponse(BaseModel):
    date: date
    count: int


class MealFoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    ingredients: list[str]
    cooking_method: FoodPreparation | None = None
    serving_note: str
    traits: dict[str, Any]
    history: str | None
    source: str
    acceptance: int | None = None
    origin: FoodSource | None = None
    position: int


class MealReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    after_photo_uri: str
    outcomes: list[dict[str, Any]]
    difficulties: dict[str, Any]
    suggestion_feedback: dict[str, SuggestionFeedback] = Field(default_factory=dict)
    saved_at: datetime


class MealSuggestionResponse(BaseModel):
    managed: bool = False
    model_config = ConfigDict(from_attributes=True)

    id: str
    food_id: str
    title: str
    description: str
    serving_tip: str | None
    ingredients: list[str]


class MealDetailResponse(BaseModel):
    id: str
    child_id: str
    meal_date: date
    meal_type: str
    setting: str
    before_photo_uri: str | None
    saved_at: datetime
    suggestion_links: list[SuggestionLinkRequest] = Field(default_factory=list)
    foods: list[MealFoodResponse]
    review: MealReviewResponse | None
    suggestions: list[MealSuggestionResponse]
