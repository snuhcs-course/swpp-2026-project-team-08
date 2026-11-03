# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Read check-in ingredients from their own table
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식별 재료와 추천 시도를 새 ORM 에서 읽도록 재작성

"""인증된 사용자의 식사와 딸린 기록을 읽는다."""

from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    FoodRecommendation,
    FoodRecommendationTry,
    Meal,
    MealFood,
    MealFoodIngredient,
)


@dataclass(frozen=True)
class FoodRecords:
    """음식 하나와 그 음식의 재료, 추천 시도."""

    food: MealFood
    ingredients: list[MealFoodIngredient]
    tries: list[tuple[FoodRecommendationTry, FoodRecommendation]]


@dataclass(frozen=True)
class MealRecords:
    meal: Meal
    foods: list[FoodRecords]


async def owned_meal(session: AsyncSession, user_id: int, meal_id: int) -> Meal | None:
    return await session.scalar(select(Meal).where(Meal.id == meal_id, Meal.user_id == user_id))


async def meal_records(session: AsyncSession, meal: Meal) -> MealRecords:
    return (await meals_records(session, [meal]))[0]


async def meals_records(session: AsyncSession, meals: list[Meal]) -> list[MealRecords]:
    if not meals:
        return []
    meal_ids = [meal.id for meal in meals]
    foods = (
        await session.scalars(
            select(MealFood)
            .where(MealFood.meal_id.in_(meal_ids))
            .order_by(MealFood.meal_id, MealFood.id)
        )
    ).all()
    food_ids = [food.id for food in foods]
    ingredients: list[MealFoodIngredient] = []
    tries: list[tuple[FoodRecommendationTry, FoodRecommendation]] = []
    if food_ids:
        ingredients = list(
            (
                await session.scalars(
                    select(MealFoodIngredient)
                    .where(MealFoodIngredient.meal_food_id.in_(food_ids))
                    .order_by(MealFoodIngredient.meal_food_id, MealFoodIngredient.id)
                )
            ).all()
        )
        tries = [
            (item, recommendation)
            for item, recommendation in (
                await session.execute(
                    select(FoodRecommendationTry, FoodRecommendation)
                    .join(
                        FoodRecommendation,
                        FoodRecommendationTry.food_recommendation_id == FoodRecommendation.id,
                    )
                    .where(FoodRecommendationTry.food_id.in_(food_ids))
                    .order_by(FoodRecommendationTry.food_id, FoodRecommendationTry.id)
                )
            ).all()
        ]
    ingredients_by_food: dict[int, list[MealFoodIngredient]] = defaultdict(list)
    tries_by_food: dict[int, list[tuple[FoodRecommendationTry, FoodRecommendation]]] = defaultdict(
        list
    )
    for ingredient in ingredients:
        ingredients_by_food[ingredient.meal_food_id].append(ingredient)
    for item, recommendation in tries:
        tries_by_food[item.food_id].append((item, recommendation))
    foods_by_meal: dict[int, list[FoodRecords]] = defaultdict(list)
    for food in foods:
        foods_by_meal[food.meal_id].append(
            FoodRecords(food, ingredients_by_food[food.id], tries_by_food[food.id])
        )
    return [MealRecords(meal, foods_by_meal[meal.id]) for meal in meals]
