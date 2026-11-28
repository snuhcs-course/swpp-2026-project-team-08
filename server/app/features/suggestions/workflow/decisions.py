# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 추천 상태와 거절 이유 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가

"""보호자가 추천에 내린 결정(`FoodRecommendationStatus`, `FoodRecommendationDismissReason`)의
프롬프트용 설명.

LLM 에는 코드(`DISMISSED`, `NOT_FIT`) 대신 문장을 보낸다. 거절 이유는 보호자의 판단이며
아이의 식후 반응이 아니다. 모든 값에 설명이 있어야 하며 테스트가 이를 확인한다.
"""

from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)

STATUS_DESCRIPTIONS: dict[FoodRecommendationStatus, str] = {
    FoodRecommendationStatus.PENDING: "보호자가 아직 결정하지 않았다",
    FoodRecommendationStatus.SAVED: "보호자가 저장했다",
    FoodRecommendationStatus.DISMISSED: "보호자가 거절했다",
    FoodRecommendationStatus.TRIED: "보호자가 식사에서 시도했다",
}

DISMISS_REASON_DESCRIPTIONS: dict[FoodRecommendationDismissReason, str] = {
    FoodRecommendationDismissReason.RESTRICTION: "아이의 식이 제한에 맞지 않는다고 봐서",
    FoodRecommendationDismissReason.DISLIKE: "아이가 싫어할 것 같아서",
    FoodRecommendationDismissReason.NOT_FIT: "지금 아이에게 맞지 않는다고 봐서",
    FoodRecommendationDismissReason.TOO_MUCH_PREPARATION: "준비가 너무 번거로워서",
    FoodRecommendationDismissReason.INGREDIENT_HARD_TO_GET: "재료를 구하기 어려워서",
    FoodRecommendationDismissReason.ALREADY_TRIED: "이미 시도해 본 음식이라서",
}


def describe_status(code: str) -> str:
    """추천 상태 코드를 문장으로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return STATUS_DESCRIPTIONS[FoodRecommendationStatus(code)]
    except (ValueError, KeyError):
        return code


def describe_dismiss_reason(code: str) -> str:
    """거절 이유 코드를 "~해서" 문장으로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return DISMISS_REASON_DESCRIPTIONS[FoodRecommendationDismissReason(code)]
    except (ValueError, KeyError):
        return code
