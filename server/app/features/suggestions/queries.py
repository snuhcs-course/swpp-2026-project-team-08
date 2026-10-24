# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""DB 재료를 그래프 입력용 값으로 읽는다."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.ingredients import (
    Catalog,
    Ingredient,
    RestrictionId,
    build_catalog,
)
from app.models import Ingredient as IngredientRow
from app.models import IngredientRestriction


async def load_catalog(session: AsyncSession) -> Catalog:
    """NEVER만 허용 증거로 읽는다. 비어 있는 DB를 mock 데이터로 대체하지 않는다."""
    rows = (
        await session.execute(
            select(IngredientRow, IngredientRestriction.restriction_id)
            .outerjoin(
                IngredientRestriction,
                (IngredientRestriction.ingredient_id == IngredientRow.id)
                & (IngredientRestriction.relation == "NEVER"),
            )
            .order_by(IngredientRow.id)
        )
    ).all()
    ingredients = {}
    never: dict[int, set[RestrictionId]] = {}
    for item, rid in rows:
        ingredients[item.id] = item
        never.setdefault(item.id, set())
        if rid in RestrictionId:
            never[item.id].add(RestrictionId(rid))
    return build_catalog(
        [
            Ingredient(
                names=tuple(n for n in (item.name, item.eng_name) if n),
                never_restrictions=frozenset(never[iid]),
            )
            for iid, item in ingredients.items()
        ]
    )
