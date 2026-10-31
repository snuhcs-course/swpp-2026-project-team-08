# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 음식 추천 관련 StrEnum 정의

"""음식 추천에 쓰는 고정 값 집합."""

from enum import StrEnum


class FoodRecommendationStatus(StrEnum):
    """추천의 처리 상태.

    TRIED 는 시도 기록(`food_recommendation_tries`)이 있다는 뜻이며 두 정보의 일관성은
    서비스가 지킨다.
    """

    PENDING = "PENDING"
    SAVED = "SAVED"
    DISMISSED = "DISMISSED"
    TRIED = "TRIED"


class FoodRecommendationDismissReason(StrEnum):
    """추천을 거절한 이유."""

    RESTRICTION = "RESTRICTION"
    DISLIKE = "DISLIKE"
    NOT_FIT = "NOT_FIT"
    TOO_MUCH_PREPARATION = "TOO_MUCH_PREPARATION"
    INGREDIENT_HARD_TO_GET = "INGREDIENT_HARD_TO_GET"
    ALREADY_TRIED = "ALREADY_TRIED"


class FoodRecommendationFeedback(StrEnum):
    """추천을 시도한 뒤의 평가."""

    HELPFUL = "HELPFUL"
    NOT_HELPFUL = "NOT_HELPFUL"
    NOT_SURE = "NOT_SURE"
