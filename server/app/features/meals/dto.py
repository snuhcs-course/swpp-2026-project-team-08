"""Request and response shapes for saving a meal."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.food_enums import FoodPreparation

MealType = Literal["breakfast", "lunch", "dinner", "snack"]
MealSetting = Literal["home", "restaurant", "school", "others"]


class IngredientInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    name: str

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("name must not be blank")
        return normalized


class FoodWriteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    name: str
    ingredients: list[IngredientInput]
    cooking_method: FoodPreparation | None = None
    serving_note: str | None = None
    acceptance: int | None = Field(default=None, ge=0, le=3, strict=True)

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must not be blank")
        return value

    @field_validator("id")
    @classmethod
    def bigint_id(cls, value: str) -> str:
        if int(value) > 2**63 - 1:
            raise ValueError("id exceeds BIGINT")
        return value


class SuggestionMealLinkInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    suggestion_id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    food_id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    ingredient_id: str | None = Field(default=None, max_length=19, pattern=r"^[1-9][0-9]*$")

    @field_validator("suggestion_id", "food_id", "ingredient_id")
    @classmethod
    def bigint_id(cls, value: str | None) -> str | None:
        if value is not None and int(value) > 2**63 - 1:
            raise ValueError("id exceeds BIGINT")
        return value


class MealWriteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    meal_date: date
    meal_type: MealType
    setting: MealSetting
    before_photo_uri: str | None = None
    foods: list[FoodWriteRequest] = Field(min_length=1)
    suggestion_links: list[SuggestionMealLinkInput] = Field(default_factory=list)

    @field_validator("foods")
    @classmethod
    def unique_food_ids(cls, foods: list[FoodWriteRequest]) -> list[FoodWriteRequest]:
        ids = [food.id for food in foods]
        if len(ids) != len(set(ids)):
            raise ValueError("food IDs must be unique")
        return foods


class MealFoodsWriteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    foods: list[FoodWriteRequest] = Field(min_length=1)

    @field_validator("foods")
    @classmethod
    def unique_food_ids(cls, foods: list[FoodWriteRequest]) -> list[FoodWriteRequest]:
        ids = [food.id for food in foods]
        if len(ids) != len(set(ids)):
            raise ValueError("food IDs must be unique")
        return foods


class MealWriteResponse(BaseModel):
    id: str
    user_id: str
    meal_date: date
    meal_type: MealType
    setting: MealSetting
    before_photo_uri: str | None
    after_photo_uri: str | None
    saved_at: datetime


class IngredientResponse(BaseModel):
    id: str
    name: str


class FoodItemDetailResponse(BaseModel):
    id: str
    meal_id: str
    name: str
    cooking_method: FoodPreparation | None
    serving_note: str | None
    acceptance: int | None
    ingredients: list[IngredientResponse]


class Difficulty(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: Literal[
        "texture",
        "tasteType",
        "tasteIntensity",
        "smell",
        "color",
        "shape",
        "visibility",
        "temperature",
        "notSure",
        "pieceSize",
        "arrangement",
    ]
    subcategory: str | None = None
    value: str


class FoodSnapshot(BaseModel):
    name: str
    ingredients: list[IngredientResponse]
    cooking_method: FoodPreparation | None
    serving_note: str | None
    acceptance: int | None


class ReviewFoodResultResponse(BaseModel):
    meal_id: str
    food_id: str
    food_snapshot: FoodSnapshot
    outcome: Literal["eaten", "tasted", "untouched", "unclear"] | None
    difficulties: list[Difficulty]


class ReviewIngredientResultResponse(BaseModel):
    meal_id: str
    food_id: str
    ingredient_id: str
    outcome: Literal["eaten", "tasted", "untouched", "unclear"] | None
    difficulties: list[Difficulty]


class ReviewResponse(BaseModel):
    food_results: list[ReviewFoodResultResponse]
    ingredient_results: list[ReviewIngredientResultResponse]


class LinkedSuggestionResponse(BaseModel):
    what_to_try: str
    why_this_may_help: str
    serving_tip: str | None


class SuggestionMealLinkResponse(BaseModel):
    id: str
    suggestion_id: str
    meal_id: str
    food_id: str
    ingredient_id: str | None
    feedback: Literal["helpful", "not_helpful", "not_sure"] | None
    created_at: datetime
    updated_at: datetime
    suggestion: LinkedSuggestionResponse


class MealDetailResponse(MealWriteResponse):
    foods: list[FoodItemDetailResponse]
    review: ReviewResponse | None
    suggestion_links: list[SuggestionMealLinkResponse]


class IngredientOutcomeInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ingredient_id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    outcome: Literal["eaten", "tasted", "untouched", "unclear"] | None = None
    difficulties: list[Difficulty] = Field(default_factory=list)

    @field_validator("ingredient_id")
    @classmethod
    def bigint_id(cls, value: str) -> str:
        if int(value) > 2**63 - 1:
            raise ValueError("id exceeds BIGINT")
        return value


class FoodReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    food_id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    outcome: Literal["eaten", "tasted", "untouched", "unclear"] | None = None
    difficulties: list[Difficulty] = Field(default_factory=list)
    ingredient_outcomes: list[IngredientOutcomeInput] = Field(default_factory=list)

    @field_validator("food_id")
    @classmethod
    def bigint_id(cls, value: str) -> str:
        if int(value) > 2**63 - 1:
            raise ValueError("id exceeds BIGINT")
        return value


class MealReviewWriteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    after_photo_uri: str | None = None
    food_results: list[FoodReviewInput]


class MealReviewResponse(ReviewResponse):
    meal: MealWriteResponse
