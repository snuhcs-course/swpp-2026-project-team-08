# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 추천, 대문자 enum, 조리법·원인·재료 응답 필드로 재편

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 생성 대상의 거절 추천 ID와 추가 추천 상태 응답
# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 홈 추천 생성 요청·원본 정보·음식명 응답과 사유 없는 제외 지원

"""추천 요청과 응답의 모양.

값 검증은 DB 제약이 아니라 이 DTO 가 맡는다. enum 값은 모두 대문자이며,
허용 값 밖의 값과 정의하지 않은 필드는 422 로 거절된다.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)
from app.models.meal_enums import MealCookingMethod

BigintId = str


class SuggestionResponse(BaseModel):
    replacement_for_id: BigintId | None = None
    id: BigintId
    user_id: BigintId
    # 추천의 근거가 된 음식과 그 음식이 속한 식사
    origin_food_id: BigintId | None
    meal_id: BigintId | None
    food_name: str
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


class SuggestionGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SuggestionDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal[FoodRecommendationStatus.SAVED, FoodRecommendationStatus.DISMISSED]
    dismiss_reasons: list[FoodRecommendationDismissReason] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_reasons(self) -> "SuggestionDecisionRequest":
        if self.status == FoodRecommendationStatus.SAVED and self.dismiss_reasons:
            raise ValueError("saved suggestions cannot have dismiss reasons")
        if len(self.dismiss_reasons) != len(set(self.dismiss_reasons)):
            raise ValueError("dismiss reasons must be unique")
        return self
