# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
# Changed: 마이페이지·자녀 프로필 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 바뀐 ORM 에 맞춰 계정 삭제 시 지우는 테이블 목록 갱신

"""계정을 삭제하기 전에 그 계정이 소유한 행을 지운다.

테스트용 SQLite 는 FK 의 ON DELETE CASCADE 를 강제하지 않으므로 자식 테이블부터 직접 지운다.
"""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    FoodRecommendation,
    FoodRecommendationTry,
    Meal,
    MealFood,
    MealFoodIngredient,
    UserConsent,
    UserEmailChangeAttempt,
    UserProfile,
    UserProfileSafeFood,
)


async def delete_user_owned_rows(session: AsyncSession, user_id: int) -> None:
    meal_ids = select(Meal.id).where(Meal.user_id == user_id)
    meal_food_ids = select(MealFood.id).where(MealFood.meal_id.in_(meal_ids))
    recommendation_ids = select(FoodRecommendation.id).where(FoodRecommendation.user_id == user_id)
    # 추천 시도 기록은 추천과 음식을 모두 참조하므로 가장 먼저 지운다.
    await session.execute(
        delete(FoodRecommendationTry).where(
            FoodRecommendationTry.food_recommendation_id.in_(recommendation_ids)
            | FoodRecommendationTry.food_id.in_(meal_food_ids)
        )
    )
    await session.execute(delete(FoodRecommendation).where(FoodRecommendation.user_id == user_id))
    await session.execute(
        delete(MealFoodIngredient).where(MealFoodIngredient.meal_food_id.in_(meal_food_ids))
    )
    await session.execute(delete(MealFood).where(MealFood.meal_id.in_(meal_ids)))
    await session.execute(delete(Meal).where(Meal.user_id == user_id))
    await session.execute(delete(UserProfileSafeFood).where(UserProfileSafeFood.user_id == user_id))
    await session.execute(delete(UserProfile).where(UserProfile.user_id == user_id))
    await session.execute(delete(UserConsent).where(UserConsent.user_id == user_id))
    await session.execute(
        delete(UserEmailChangeAttempt).where(UserEmailChangeAttempt.user_id == user_id)
    )
