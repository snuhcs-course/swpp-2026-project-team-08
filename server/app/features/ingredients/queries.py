"""Shared ingredient lookups for APIs that store ingredient IDs."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient


def normalize_name(name: str) -> str:
    return " ".join(name.split()).casefold()


async def resolve_ingredient(
    session: AsyncSession, *, ingredient_id: str | None, name: str
) -> Ingredient | None:
    normalized = normalize_name(name)
    if (
        ingredient_id
        and ingredient_id.isascii()
        and ingredient_id.isdecimal()
        and len(ingredient_id) <= 19
        and int(ingredient_id) <= 9223372036854775807
    ):
        candidate = await session.get(Ingredient, int(ingredient_id))
        if candidate is not None and normalize_name(candidate.name) == normalized:
            return candidate
    catalog = (await session.scalars(select(Ingredient).order_by(Ingredient.id))).all()
    return next((item for item in catalog if normalize_name(item.name) == normalized), None)
