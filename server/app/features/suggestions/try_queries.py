# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
"""Persist confirmed meal-linked attempts in the review transaction."""

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MealLog, Suggestion, SuggestionTry


async def confirm_linked_tries(
    session: AsyncSession, meal: MealLog, feedback: dict[str, str]
) -> None:
    for link in meal.suggestion_links:
        if feedback.get(link["suggestion_id"]) != "tried":
            continue
        suggestion = await session.get(Suggestion, link["suggestion_id"])
        # Legacy local cards have no server suggestion. Keep their review feedback only.
        if (
            suggestion is None
            or suggestion.child_id != meal.child_id
            or suggestion.saved_at is None
        ):
            continue
        target_id = f"food:{link['food_id']}"
        existing = await session.scalar(
            select(SuggestionTry).where(
                SuggestionTry.suggestion_id == suggestion.id,
                SuggestionTry.meal_id == meal.id,
                SuggestionTry.target_id == target_id,
            )
        )
        if existing is None:
            session.add(
                SuggestionTry(
                    id=str(uuid4()),
                    suggestion_id=suggestion.id,
                    meal_id=meal.id,
                    target_id=target_id,
                    tried_on=meal.meal_date,
                )
            )
    await session.flush()
