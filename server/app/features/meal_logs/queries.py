# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""식사 기록 조회 함수."""

from datetime import date

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import MealLog, MealSuggestion


def meal_with_children() -> Select[tuple[MealLog]]:
    return select(MealLog).options(
        selectinload(MealLog.foods),
        selectinload(MealLog.review),
        selectinload(MealLog.suggestions),
    )


async def get_meal(session: AsyncSession, meal_id: str) -> MealLog | None:
    result = await session.execute(meal_with_children().where(MealLog.id == meal_id))
    return result.scalar_one_or_none()


async def list_meals(
    session: AsyncSession,
    *,
    child_id: str,
    meal_date: date | None,
) -> list[MealLog]:
    stmt = (
        meal_with_children()
        .where(MealLog.child_id == child_id)
        .order_by(MealLog.meal_date.desc(), MealLog.saved_at.desc())
    )
    if meal_date is not None:
        stmt = stmt.where(MealLog.meal_date == meal_date)
    result = await session.execute(stmt)
    return list(result.scalars().unique().all())


async def calendar_counts(
    session: AsyncSession,
    *,
    child_id: str,
    start: date,
    end: date,
) -> list[tuple[date, int]]:
    stmt = (
        select(MealLog.meal_date, func.count(MealLog.id))
        .where(MealLog.child_id == child_id)
        .where(MealLog.meal_date >= start)
        .where(MealLog.meal_date < end)
        .group_by(MealLog.meal_date)
        .order_by(MealLog.meal_date)
    )
    result = await session.execute(stmt)
    return [(row[0], int(row[1])) for row in result.all()]


async def get_suggestion(session: AsyncSession, suggestion_id: str) -> MealSuggestion | None:
    result = await session.execute(select(MealSuggestion).where(MealSuggestion.id == suggestion_id))
    return result.scalar_one_or_none()
