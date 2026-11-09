# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 추천, 대문자 enum, 조리법·원인·재료 응답 필드로 재편

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 생성 대상의 거절 추천 ID와 추가 추천 상태 응답

"""추천 요청과 응답의 모양.

값 검증은 DB 제약이 아니라 이 DTO 가 맡는다. enum 값은 모두 대문자이며,
허용 값 밖의 값과 정의하지 않은 필드는 422 로 거절된다.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)
from app.models.meal_enums import MealCookingMethod

BigintId = str


def _bigint_id(value: str) -> str:
    if int(value) > 2**63 - 1:
        raise ValueError("id exceeds BIGINT")
    return value


EntityId = Annotated[
    str, Field(max_length=19, pattern=r"^[1-9][0-9]*$"), AfterValidator(_bigint_id)
]

# 추천을 보여 줄 상태를 고르는 조회용 값이다. ALL 은 enum 값이 아니다.
ListFilter = Literal["SAVED", "ALL"]


class SuggestionResponse(BaseModel):
    can_regenerate: bool = False
    replacement_for_id: BigintId | None = None
    id: BigintId
    user_id: BigintId
    # 추천의 근거가 된 음식과 그 음식이 속한 식사
    origin_food_id: BigintId
    meal_id: BigintId
    what_to_try: str
    why_this_may_help: str
    serving_tip: str | None
    ingredients: list[str]
    cooking_method: MealCookingMethod
    causes: str
    status: FoodRecommendationStatus
    dismiss_reasons: list[FoodRecommendationDismissReason]
    saved_at: datetime | None
    created_at: datetime


class SuggestionTarget(BaseModel):
    """추천 대상 음식과, 추가 생성을 요청할 때만 지정하는 거절한 추천 ID."""

    model_config = ConfigDict(extra="forbid")

    food_id: EntityId
    rejected_suggestion_id: EntityId | None = None


class SuggestionGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    targets: list[SuggestionTarget] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_targets(self) -> "SuggestionGenerateRequest":
        ids = [item.food_id for item in self.targets]
        if len(ids) != len(set(ids)):
            raise ValueError("targets must be unique")
        return self


class SuggestionDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal[FoodRecommendationStatus.SAVED, FoodRecommendationStatus.DISMISSED]
    dismiss_reasons: list[FoodRecommendationDismissReason] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_reasons(self) -> "SuggestionDecisionRequest":
        if self.status == FoodRecommendationStatus.SAVED and self.dismiss_reasons:
            raise ValueError("saved suggestions cannot have dismiss reasons")
        if self.status == FoodRecommendationStatus.DISMISSED and not self.dismiss_reasons:
            raise ValueError("dismissed suggestions need a reason")
        if len(self.dismiss_reasons) != len(set(self.dismiss_reasons)):
            raise ValueError("dismiss reasons must be unique")
        return self
