# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap

"""임의의 사용자를 가정한 mock 제한 목록.

아이의 알러지 · 식이 제한을 서버가 아직 알지 못하므로 임시로 쓴다.
실제 출처가 정해지면 이 모듈을 쓰는 곳(서비스)에서 `ChildRestrictions`를 만드는 방식만 바꾼다.
"""

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId

MOCK_RESTRICTIONS = ChildRestrictions(
    ids=frozenset(
        {
            RestrictionId.PEANUT,
            RestrictionId.MILK,
            RestrictionId.LACTOSE_FREE,
            RestrictionId.CASEIN_FREE,
            RestrictionId.LOW_FRUCTOSE,
        }
    ),
)
