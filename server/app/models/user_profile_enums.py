# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 자녀 나이대 AgeGroup StrEnum 정의

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
