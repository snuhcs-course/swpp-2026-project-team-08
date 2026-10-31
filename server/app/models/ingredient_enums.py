# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 재료 제한 판정 정도 RestrictionDegree StrEnum 정의

"""추천용 재료 카탈로그의 제한 판정에 쓰는 고정 값 집합."""

from enum import StrEnum


class RestrictionDegree(StrEnum):
    """재료가 제한에 걸리는 정도.

    NEVER < DEPENDS_ON_PRODUCT < ALWAYS 순서가 있는 척도다.
    섭취량이나 증상의 심각도를 뜻하지 않는다.
    """

    # 제한에 걸리지 않음
    NEVER = "NEVER"
    # 제품 배합에 따라 걸릴 수 있음
    DEPENDS_ON_PRODUCT = "DEPENDS_ON_PRODUCT"
    # 제한에 항상 걸림
    ALWAYS = "ALWAYS"
