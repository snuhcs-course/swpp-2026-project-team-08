# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 식사 관련 StrEnum 정의 (MealType, MealSetting, MealCookingMethod, EatingOutcome)
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 조리법 개별 값과 신규 입력 열 가지 정의

"""식사와 음식에 쓰는 고정 값 집합.

멤버 이름과 값은 같은 대문자 문자열이다. DB 에는 네이티브 enum 없이 문자열로 저장하며,
허용 값 검증은 DB 제약이 아니라 이 enum 과 DTO 가 맡는다.
"""

from enum import StrEnum
from typing import Literal


class MealType(StrEnum):
    """식사 종류."""

    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    SNACK = "SNACK"


class MealSetting(StrEnum):
    """식사 장소."""

    HOME = "HOME"
    RESTAURANT = "RESTAURANT"
    SCHOOL = "SCHOOL"
    OTHERS = "OTHERS"


class MealCookingMethod(StrEnum):
    """저장된 음식의 조리법. 이전 통합값도 조회할 수 있다."""

    RAW = "RAW"
    BOILED = "BOILED"
    STEAMED = "STEAMED"
    PAN_FRIED = "PAN_FRIED"
    STIR_FRIED = "STIR_FRIED"
    BAKED = "BAKED"
    ROASTED = "ROASTED"
    MASHED = "MASHED"
    BLENDED = "BLENDED"
    OTHER = "OTHER"

    # 기존 기록 조회용이며, 새 식사 입력과 추천 생성에서는 사용하지 않는다.
    BAKED_ROASTED = "BAKED_ROASTED"
    MASHED_BLENDED = "MASHED_BLENDED"


# 식사 입력과 추천 생성이 함께 사용하는 허용 목록.
MealCookingMethodInput = Literal[
    MealCookingMethod.RAW,
    MealCookingMethod.BOILED,
    MealCookingMethod.STEAMED,
    MealCookingMethod.PAN_FRIED,
    MealCookingMethod.STIR_FRIED,
    MealCookingMethod.BAKED,
    MealCookingMethod.ROASTED,
    MealCookingMethod.MASHED,
    MealCookingMethod.BLENDED,
    MealCookingMethod.OTHER,
]


class EatingOutcome(StrEnum):
    """식후 리뷰의 먹은 정도. 값이 없으면(NULL) 아직 리뷰하지 않은 것이다."""

    EATEN = "EATEN"
    TASTED = "TASTED"
    UNTOUCHED = "UNTOUCHED"
    UNCLEAR = "UNCLEAR"
