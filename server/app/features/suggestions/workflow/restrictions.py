# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 판정 모델에 보낼 아이의 제한 설명 사전 추가

"""아이의 제한(`RestrictionType`)을 가드레일 판정 모델이 읽을 문장으로 바꾼다.

판정 모델에는 코드(`ALLERGY.MILK_DAIRY`) 대신 무엇을 먹을 수 없는지가 드러나는 설명을 보낸다.
`ALLERGY.NONE` 은 "알러지 없음" 응답이라 제한이 아니므로 설명이 없다.
모든 나머지 `RestrictionType` 에 설명이 있어야 하며 테스트가 이를 확인한다.
"""

from collections.abc import Iterable

from app.models.restriction_enums import RestrictionType

RESTRICTION_DESCRIPTIONS: dict[RestrictionType, str] = {
    RestrictionType.ALLERGY_PEANUTS: "땅콩 알러지",
    RestrictionType.ALLERGY_TREE_NUTS: "견과류(호두·아몬드 등 나무 열매) 알러지",
    RestrictionType.ALLERGY_MILK_DAIRY: "우유·유제품 알러지",
    RestrictionType.ALLERGY_EGGS: "달걀 알러지",
    RestrictionType.ALLERGY_SOY: "대두(콩) 알러지",
    RestrictionType.ALLERGY_WHEAT: "밀 알러지",
    RestrictionType.ALLERGY_FISH: "생선 알러지",
    RestrictionType.ALLERGY_SHELLFISH: "갑각류·조개류 알러지",
    RestrictionType.ALLERGY_SESAME: "참깨 알러지",
    RestrictionType.VEGETARIAN_DAIRY: "채식: 유제품을 먹지 않음",
    RestrictionType.VEGETARIAN_EGGS: "채식: 달걀을 먹지 않음",
    RestrictionType.VEGETARIAN_SEAFOOD: "채식: 해산물을 먹지 않음",
    RestrictionType.VEGETARIAN_POULTRY: "채식: 닭·오리 등 가금류를 먹지 않음",
    RestrictionType.VEGETARIAN_RED_MEAT: "채식: 소·돼지·양 등 붉은 고기를 먹지 않음",
    RestrictionType.VEGETARIAN_LEGUMES_SOY: "채식: 콩류·대두를 먹지 않음",
    RestrictionType.VEGETARIAN_NUTS_SEEDS: "채식: 견과류·씨앗류를 먹지 않음",
    RestrictionType.DIETARY_APPROACH_GLUTEN_FREE: (
        "글루텐 프리: 밀·보리·호밀 등 글루텐이 든 재료를 먹지 않음"
    ),
    RestrictionType.DIETARY_APPROACH_CASEIN_FREE: (
        "카제인 프리: 우유 단백질(카제인)이 든 유제품을 먹지 않음"
    ),
    RestrictionType.DIETARY_APPROACH_LACTOSE_FREE: "유당 프리: 유당이 든 재료를 먹지 않음",
}


def describe_restrictions(types: Iterable[RestrictionType]) -> tuple[str, ...]:
    """제한 설명을 코드 순서로 돌려준다. 설명이 없는 값(`ALLERGY.NONE`)은 뺀다."""
    return tuple(
        RESTRICTION_DESCRIPTIONS[kind]
        for kind in sorted(types, key=lambda item: item.value)
        if kind in RESTRICTION_DESCRIPTIONS
    )
