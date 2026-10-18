# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
"""식사 기록 조회 함수."""

from dataclasses import dataclass
from datetime import date

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import MealLog, MealSuggestion


# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
@dataclass(frozen=True)
class LinkedSuggestion:
    """Suggestion snapshot attached to a source or trial food, independent of HTTP DTOs."""

    id: str
    food_id: str
    title: str
    description: str
    serving_tip: str | None
    ingredients: list[str]
    managed: bool = True


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


# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
async def linked_suggestions(session: AsyncSession, meal: MealLog) -> list[LinkedSuggestion]:
    """Read suggestion snapshots without calling another feature's service."""
    from app.models import Suggestion, SuggestionTry

    source = list(
        (
            await session.scalars(
                select(Suggestion)
                .where(
                    Suggestion.child_id == meal.child_id,
                    Suggestion.meal_id == meal.id,
                    Suggestion.saved_at.is_not(None),
                )
                .order_by(Suggestion.created_at.desc())
            )
        ).all()
    )
    rows = (
        await session.execute(
            select(Suggestion, SuggestionTry)
            .join(SuggestionTry, SuggestionTry.suggestion_id == Suggestion.id)
            .where(Suggestion.child_id == meal.child_id, SuggestionTry.meal_id == meal.id)
            .order_by(SuggestionTry.created_at.desc())
        )
    ).all()
    pairs = [(s, s.food_id) for s in source]
    for suggestion, tried in rows:
        food_id = next(
            (
                f.id
                for f in meal.foods
                if tried.target_id == f"food:{f.id}"
                or tried.target_id.startswith(f"ingredient:{f.id}:")
            ),
            None,
        )
        if food_id:
            pairs.append((suggestion, food_id))
    return [
        LinkedSuggestion(
            id=s.id,
            food_id=food_id,
            title=s.content["what_to_try"],
            description=s.content["why_this_may_help"],
            serving_tip=s.content["serving_tip"],
            ingredients=list(s.content["ingredients"]),
        )
        for s, food_id in pairs
    ]
