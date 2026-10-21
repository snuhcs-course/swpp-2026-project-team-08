# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
"""Delete records owned by one account before removing the user."""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    FoodItem,
    Meal,
    MealFoodIngredient,
    ReviewFoodResult,
    ReviewIngredientResult,
    SafeFood,
    SuggestionMealLink,
    UserConsent,
    UserProfile,
    UserProfileChoice,
    UserSuggestion,
)


async def delete_user_owned_rows(session: AsyncSession, user_id: int) -> None:
    meal_ids = select(Meal.id).where(Meal.user_id == user_id)
    suggestion_ids = select(UserSuggestion.id).where(UserSuggestion.user_id == user_id)
    await session.execute(
        delete(SuggestionMealLink).where(
            SuggestionMealLink.meal_id.in_(meal_ids)
            | SuggestionMealLink.suggestion_id.in_(suggestion_ids)
        )
    )
    await session.execute(
        delete(ReviewIngredientResult).where(ReviewIngredientResult.meal_id.in_(meal_ids))
    )
    await session.execute(delete(ReviewFoodResult).where(ReviewFoodResult.meal_id.in_(meal_ids)))
    await session.execute(
        delete(MealFoodIngredient).where(MealFoodIngredient.meal_id.in_(meal_ids))
    )
    await session.execute(delete(FoodItem).where(FoodItem.meal_id.in_(meal_ids)))
    await session.execute(delete(Meal).where(Meal.user_id == user_id))
    await session.execute(delete(UserSuggestion).where(UserSuggestion.user_id == user_id))
    await session.execute(delete(SafeFood).where(SafeFood.user_id == user_id))
    await session.execute(delete(UserProfileChoice).where(UserProfileChoice.user_id == user_id))
    await session.execute(delete(UserProfile).where(UserProfile.user_id == user_id))
    await session.execute(delete(UserConsent).where(UserConsent.user_id == user_id))
