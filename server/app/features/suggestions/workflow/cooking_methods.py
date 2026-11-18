# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 조리 방법(MealCookingMethod) 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가

"""조리 방법(`MealCookingMethod`) 코드의 프롬프트용 설명.

LLM 에는 코드(`STEAMED`) 대신 조리 방법 이름을 보낸다. 출력 스키마에서 모델이 고르는 값의
뜻을 알리는 데도 같은 설명을 쓴다. 모든 `MealCookingMethod` 에 설명이 있어야 하며 테스트가
이를 확인한다.
"""

from app.models.meal_enums import MealCookingMethod

COOKING_METHOD_DESCRIPTIONS: dict[MealCookingMethod, str] = {
    MealCookingMethod.RAW: "익히지 않고 날것으로",
    MealCookingMethod.BOILED: "삶거나 끓이기",
    MealCookingMethod.STEAMED: "찌기",
    MealCookingMethod.PAN_FRIED: "팬에 지지거나 부치기",
    MealCookingMethod.STIR_FRIED: "기름에 볶기",
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
        f"{method.value}({text})" for method, text in COOKING_METHOD_DESCRIPTIONS.items()
    )
