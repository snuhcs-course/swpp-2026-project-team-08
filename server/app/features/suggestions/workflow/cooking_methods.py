# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 조리 방법(MealCookingMethod) 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가
# AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
# Changed: 개별 조리법 설명과 현재 입력 선택지 열 가지 제공

"""조리 방법(`MealCookingMethod`) 코드의 프롬프트용 설명.

LLM 에는 코드(`STEAMED`) 대신 조리 방법 이름을 보낸다. 출력 스키마에서 모델이 고르는 값의
뜻을 알리는 데도 같은 설명을 쓴다. 기존 기록용 통합값을 포함한 모든 `MealCookingMethod` 에
설명이 있으며, 출력 선택지는 `MealCookingMethodInput` 으로 제한한다.
"""

from typing import get_args

from app.models.meal_enums import MealCookingMethod, MealCookingMethodInput

COOKING_METHOD_DESCRIPTIONS: dict[MealCookingMethod, str] = {
    MealCookingMethod.RAW: "익히지 않고 날것으로",
    MealCookingMethod.BOILED: "삶거나 끓이기",
    MealCookingMethod.STEAMED: "찌기",
    MealCookingMethod.PAN_FRIED: "팬에 지지거나 부치기",
    MealCookingMethod.STIR_FRIED: "기름에 볶기",
    MealCookingMethod.BAKED: "오븐에서 굽기(베이킹)",
    MealCookingMethod.ROASTED: "불이나 오븐에서 로스팅하기",
    MealCookingMethod.MASHED: "으깨기",
    MealCookingMethod.BLENDED: "곱게 갈기",
    MealCookingMethod.BAKED_ROASTED: "오븐이나 불에 굽기",
    MealCookingMethod.MASHED_BLENDED: "으깨거나 갈기",
    MealCookingMethod.OTHER: "그 밖의 조리 방법",
}


def describe_cooking_method(code: str) -> str:
    """조리 방법 코드를 설명으로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return COOKING_METHOD_DESCRIPTIONS[MealCookingMethod(code)]
    except (ValueError, KeyError):
        return code


def cooking_method_choices() -> str:
    """출력 스키마 설명용 선택지 목록. 예: 'RAW(익히지 않고 날것으로), BOILED(삶거나 끓이기)'."""
    return ", ".join(
        f"{method.value}({COOKING_METHOD_DESCRIPTIONS[method]})"
        for method in get_args(MealCookingMethodInput)
    )
