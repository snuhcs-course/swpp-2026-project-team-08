"""Shared ingredient lookups for APIs that store ingredient IDs."""

# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
from secrets import randbelow

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ingredient import Ingredient


def normalize_name(name: str) -> str:
    return " ".join(name.split()).casefold()


# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
async def resolve_ingredient(
    session: AsyncSession, *, ingredient_id: str | None, name: str, create: bool = False
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
    match = next((item for item in catalog if normalize_name(item.name) == normalized), None)
    if match is not None or not create or not normalized:
        return match

    insert = sqlite_insert if session.get_bind().dialect.name == "sqlite" else postgres_insert
    await session.execute(
        insert(Ingredient)
        .values(id=randbelow(2**63 - 1) + 1, name=name.strip())
        .on_conflict_do_nothing(index_elements=[Ingredient.name])
    )
    return await session.scalar(select(Ingredient).where(Ingredient.name == name.strip()))
