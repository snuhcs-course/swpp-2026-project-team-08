# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 프로필과 재료 판정이 공유하는 RestrictionType StrEnum 정의

"""아이의 제한(알러지, 채식, 식이 제한) 값.

프로필의 `restrictions` 와 재료의 `ingredient_restrictions.restriction_type` 이 같은 enum 을 쓴다.
값은 category 를 점(`.`)으로 구분한 경로 문자열이고, 멤버 이름은 점 대신 `_` 를 쓴다.
알러지와 채식의 `EGGS` 처럼 값이 겹치는 경우를 category 로 구분한다.
"""

from enum import StrEnum


class RestrictionType(StrEnum):
    """제한 20개 (ALLERGY 10, VEGETARIAN 7, DIETARY_APPROACH 3).

    `ALLERGY.NONE` 은 프로필에서 "알러지 없음"을 뜻하는 응답이다. 재료의 판정에는 쓰지 않는다.
    """

    # 알러지
    ALLERGY_NONE = "ALLERGY.NONE"
    ALLERGY_PEANUTS = "ALLERGY.PEANUTS"
    ALLERGY_TREE_NUTS = "ALLERGY.TREE_NUTS"
    ALLERGY_MILK_DAIRY = "ALLERGY.MILK_DAIRY"
    ALLERGY_EGGS = "ALLERGY.EGGS"
    ALLERGY_SOY = "ALLERGY.SOY"
    ALLERGY_WHEAT = "ALLERGY.WHEAT"
    ALLERGY_FISH = "ALLERGY.FISH"
    ALLERGY_SHELLFISH = "ALLERGY.SHELLFISH"
    ALLERGY_SESAME = "ALLERGY.SESAME"

    # 채식
    VEGETARIAN_DAIRY = "VEGETARIAN.DAIRY"
    VEGETARIAN_EGGS = "VEGETARIAN.EGGS"
    VEGETARIAN_SEAFOOD = "VEGETARIAN.SEAFOOD"
    VEGETARIAN_POULTRY = "VEGETARIAN.POULTRY"
    VEGETARIAN_RED_MEAT = "VEGETARIAN.RED_MEAT"
    VEGETARIAN_LEGUMES_SOY = "VEGETARIAN.LEGUMES_SOY"
    VEGETARIAN_NUTS_SEEDS = "VEGETARIAN.NUTS_SEEDS"

    # 식이 제한
    DIETARY_APPROACH_GLUTEN_FREE = "DIETARY_APPROACH.GLUTEN_FREE"
    DIETARY_APPROACH_CASEIN_FREE = "DIETARY_APPROACH.CASEIN_FREE"
    DIETARY_APPROACH_LACTOSE_FREE = "DIETARY_APPROACH.LACTOSE_FREE"
