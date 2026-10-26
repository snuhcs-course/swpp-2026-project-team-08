# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""테스트 전용 허용 증거. 누락된 판정의 여집합으로 NEVER를 만들지 않는다."""

from app.features.suggestions.ingredients import Ingredient, RestrictionId, build_catalog


def item(names, *never):
    return Ingredient(tuple(names), frozenset(RestrictionId(r) for r in never))


CATALOG = build_catalog(
    [
        item(["carrot", "당근"], "peanut", "milk"),
        item(["rice", "쌀"], "peanut", "milk"),
        item(["peanut butter", "땅콩버터"], "milk"),
        item(["milk", "우유"], "peanut", "egg"),
        item(["cheese", "치즈"], "peanut"),
    ]
)


async def seed_mock_allowed_ingredient(session, ingredient_id):
    """프로필 없이 기존 고정 제한 전체에 허용되는 테스트 재료를 등록한다."""
    from app.features.suggestions.mock_profile import MOCK_RESTRICTIONS
    from app.models import IngredientRestriction, Restriction

    for rid in MOCK_RESTRICTIONS.ids:
        if await session.get(Restriction, rid) is None:
            session.add(Restriction(id=rid, name=rid, type="DIET"))
    await session.flush()
    session.add_all(
        [
            IngredientRestriction(ingredient_id=ingredient_id, restriction_id=rid, relation="NEVER")
            for rid in MOCK_RESTRICTIONS.ids
        ]
    )
