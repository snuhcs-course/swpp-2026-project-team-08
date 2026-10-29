# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Resolve check-in ingredients without writing to the shared catalog
"""Resolve recorded names in the check-in ingredient store."""

from secrets import randbelow

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.ingredients.queries import normalize_name, resolve_ingredient
from app.models.meal_ingredient import MealIngredient


async def resolve_meal_ingredient(
    session: AsyncSession, *, ingredient_id: str | None, name: str
) -> MealIngredient | None:
    normalized = normalize_name(name)
    if not normalized:
        return None
    query = select(MealIngredient).where(MealIngredient.normalized_name == normalized)
    existing = await session.scalar(query)
    if existing is not None:
        return existing

    catalog_item = await resolve_ingredient(session, ingredient_id=ingredient_id, name=name)
    candidate_id = catalog_item.id if catalog_item is not None else randbelow(2**63 - 1) + 1
    insert = sqlite_insert if session.get_bind().dialect.name == "sqlite" else postgres_insert
    while True:
        await session.execute(
            insert(MealIngredient)
            .values(
                id=candidate_id,
                name=catalog_item.name if catalog_item is not None else name.strip(),
                normalized_name=normalized,
            )
            .on_conflict_do_nothing()
        )
        existing = await session.scalar(query)
        if existing is not None:
            return existing
        candidate_id = randbelow(2**63 - 1) + 1
