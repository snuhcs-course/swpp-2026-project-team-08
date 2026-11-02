# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 대문자 enum, 서버 발급 id, 음식 안 리뷰 결과·난이도 사유 문자열 목록으로 재편

"""식사 저장·수정·리뷰의 요청과 응답 모양.

값 검증은 DB 제약이 아니라 이 DTO 가 맡는다. enum 값은 모두 대문자이며,
허용 값 밖의 값과 정의하지 않은 필드는 422 로 거절된다.
"""

from datetime import date, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

from app.models.difficulty_enums import DifficultyReason
from app.models.food_recommendation_enums import FoodRecommendationFeedback
from app.models.meal_enums import EatingOutcome, MealCookingMethod, MealSetting, MealType


def _bigint_id(value: str) -> str:
    if int(value) > 2**63 - 1:
        raise ValueError("id exceeds BIGINT")
    return value


# 서버가 발급한 id 를 가리키는 값. 새 항목에는 id 를 보내지 않는다.
EntityId = Annotated[
    str, Field(max_length=19, pattern=r"^[1-9][0-9]*$"), AfterValidator(_bigint_id)
]


def _unique_reasons(value: list[DifficultyReason]) -> list[DifficultyReason]:
    if len(value) != len(set(value)):
        raise ValueError("difficulty_reasons must not contain duplicates")
    return value


DifficultyReasons = Annotated[list[DifficultyReason], AfterValidator(_unique_reasons)]


class StrictDto(BaseModel):
    model_config = ConfigDict(extra="forbid")


class IngredientInput(StrictDto):
    """재료 입력. 사용자가 입력한 이름만 받는다."""

    name: str

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("name must not be blank")
        return normalized


class FoodWriteRequest(StrictDto):
    name: str
    ingredients: list[IngredientInput]
    cooking_method: MealCookingMethod | None = None
    serving_note: str | None = None
    acceptance: int | None = Field(default=None, ge=0, le=3, strict=True)

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must not be blank")
        return value


class MealFoodCreateRequest(FoodWriteRequest):
    """식사를 처음 저장할 때의 음식. 이 음식으로 시도한 저장된 추천 id 를 함께 보낼 수 있다."""

    food_recommendation_ids: list[EntityId] = Field(default_factory=list)

    @field_validator("food_recommendation_ids")
    @classmethod
    def unique_recommendation_ids(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("food_recommendation_ids must be unique")
        return value


class MealFoodUpdateRequest(FoodWriteRequest):
    """식사를 수정할 때의 음식. `id` 가 있으면 기존 음식을 갱신하고 없으면 새로 만든다."""

    id: EntityId | None = None


class MealWriteRequest(StrictDto):
    meal_date: date
    meal_type: MealType
    setting: MealSetting
    before_photo_uri: str | None = None
    foods: list[MealFoodCreateRequest] = Field(min_length=1)

    @field_validator("foods")
    @classmethod
    def unique_recommendation_ids(
        cls, foods: list[MealFoodCreateRequest]
    ) -> list[MealFoodCreateRequest]:
        # 같은 추천을 한 식사의 두 음식에 연결할 수 없다.
        ids = [item for food in foods for item in food.food_recommendation_ids]
        if len(ids) != len(set(ids)):
            raise ValueError("a recommendation can be linked to one food per meal")
        return foods


class MealFoodsWriteRequest(StrictDto):
    foods: list[MealFoodUpdateRequest] = Field(min_length=1)

    @field_validator("foods")
    @classmethod
    def unique_food_ids(cls, foods: list[MealFoodUpdateRequest]) -> list[MealFoodUpdateRequest]:
        ids = [food.id for food in foods if food.id is not None]
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
    # outcome 이 None 이면 아직 리뷰하지 않은 재료다.
    outcome: EatingOutcome | None
    difficulty_reasons: list[DifficultyReason]


class LinkedRecommendationResponse(BaseModel):
    what_to_try: str
    why_this_may_help: str
    serving_tip: str | None


class RecommendationTryResponse(BaseModel):
    id: str
    food_recommendation_id: str
    feedback: FoodRecommendationFeedback | None
    created_at: datetime
    updated_at: datetime
    recommendation: LinkedRecommendationResponse


class MealFoodResponse(BaseModel):
    id: str
    meal_id: str
    name: str
    cooking_method: MealCookingMethod | None
    serving_note: str | None
    acceptance: int | None
    # outcome 이 None 이면 아직 리뷰하지 않은 음식이다.
    outcome: EatingOutcome | None
    difficulty_reasons: list[DifficultyReason]
    ingredients: list[IngredientResponse]
    recommendation_tries: list[RecommendationTryResponse]


class MealDetailResponse(MealWriteResponse):
    foods: list[MealFoodResponse]


class IngredientOutcomeInput(StrictDto):
    ingredient_id: EntityId
    outcome: EatingOutcome | None = None
    difficulty_reasons: DifficultyReasons = Field(default_factory=list)


class FoodReviewInput(StrictDto):
    food_id: EntityId
    outcome: EatingOutcome
    difficulty_reasons: DifficultyReasons = Field(default_factory=list)
    ingredient_outcomes: list[IngredientOutcomeInput] = Field(default_factory=list)


class MealReviewWriteRequest(StrictDto):
    after_photo_uri: str | None = None
    food_results: list[FoodReviewInput]
