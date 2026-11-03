# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 자녀 나이대 AgeGroup StrEnum 정의
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 DietaryPattern StrEnum 추가

"""자녀 프로필에 쓰는 고정 값 집합."""

from enum import StrEnum


class AgeGroup(StrEnum):
    """자녀의 나이대.

    기존 값(`under-2`, `2-3`, `4-5`, `6-8`, `9-12`, `13-plus`)은 숫자로 시작하거나 `-` 를
    포함해 멤버 이름이 될 수 없어서 새 이름을 정했다.
    """

    UNDER_2 = "UNDER_2"
    AGE_2_3 = "AGE_2_3"
    AGE_4_5 = "AGE_4_5"
    AGE_6_8 = "AGE_6_8"
    AGE_9_12 = "AGE_9_12"
    AGE_13_PLUS = "AGE_13_PLUS"


class DietaryPattern(StrEnum):
    """가족의 식생활 유형. 보호자가 고르는 단일 선택이며 제한(`RestrictionType`)과는 별개다.

    프로필에서 값이 없으면(NULL) 미응답이고, `NO_SPECIFIC_PATTERN` 은 "특정 유형 없음"이라는
    응답이다. 추천 생성에는 적용하지 않는다.
    """

    VEGAN = "VEGAN"
    LACTO_VEGETARIAN = "LACTO_VEGETARIAN"
    OVO_VEGETARIAN = "OVO_VEGETARIAN"
    LACTO_OVO_VEGETARIAN = "LACTO_OVO_VEGETARIAN"
    PESCATARIAN = "PESCATARIAN"
    FLEXITARIAN = "FLEXITARIAN"
    NO_SPECIFIC_PATTERN = "NO_SPECIFIC_PATTERN"
