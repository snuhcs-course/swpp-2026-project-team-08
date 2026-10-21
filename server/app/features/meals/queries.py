"""Read authenticated meals and their related records."""

from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    FoodItem,
    Ingredient,
    Meal,
    MealFoodIngredient,
    ReviewFoodResult,
    ReviewIngredientResult,
    SuggestionMealLink,
    UserSuggestion,
)


@dataclass(frozen=True)
class MealRecords:
    meal: Meal
    foods: list[FoodItem]
    ingredients: list[tuple[MealFoodIngredient, Ingredient]]
    food_results: list[ReviewFoodResult]
    ingredient_results: list[ReviewIngredientResult]
    links: list[tuple[SuggestionMealLink, UserSuggestion]]


async def owned_meal(session: AsyncSession, user_id: int, meal_id: int) -> Meal | None:
    return await session.scalar(select(Meal).where(Meal.id == meal_id, Meal.user_id == user_id))


async def meal_records(session: AsyncSession, meal: Meal) -> MealRecords:
    return (await meals_records(session, [meal]))[0]


async def meals_records(session: AsyncSession, meals: list[Meal]) -> list[MealRecords]:
    if not meals:
        return []
    ids = [meal.id for meal in meals]
    foods = (
        await session.scalars(
            select(FoodItem)
            .where(FoodItem.meal_id.in_(ids))
            .order_by(FoodItem.meal_id, FoodItem.id)
        )
    ).all()
    ingredients = (
        await session.execute(
            select(MealFoodIngredient, Ingredient)
            .join(Ingredient, MealFoodIngredient.ingredient_id == Ingredient.id)
            .where(MealFoodIngredient.meal_id.in_(ids))
            .order_by(MealFoodIngredient.meal_id, MealFoodIngredient.food_id, Ingredient.id)
        )
    ).all()
    food_results = (
        await session.scalars(
            select(ReviewFoodResult)
            .where(ReviewFoodResult.meal_id.in_(ids))
            .order_by(ReviewFoodResult.meal_id, ReviewFoodResult.food_id)
        )
    ).all()
    ingredient_results = (
        await session.scalars(
            select(ReviewIngredientResult)
            .where(ReviewIngredientResult.meal_id.in_(ids))
            .order_by(
                ReviewIngredientResult.meal_id,
                ReviewIngredientResult.food_id,
                ReviewIngredientResult.ingredient_id,
            )
        )
    ).all()
    links = (
        await session.execute(
            select(SuggestionMealLink, UserSuggestion)
            .join(UserSuggestion, SuggestionMealLink.suggestion_id == UserSuggestion.id)
            .where(SuggestionMealLink.meal_id.in_(ids))
            .order_by(SuggestionMealLink.meal_id, SuggestionMealLink.id)
        )
    ).all()
    foods_by_meal = defaultdict(list)
    ingredients_by_meal = defaultdict(list)
    food_results_by_meal = defaultdict(list)
    ingredient_results_by_meal = defaultdict(list)
    links_by_meal = defaultdict(list)
    for food in foods:
        foods_by_meal[food.meal_id].append(food)
    for link, ingredient in ingredients:
        ingredients_by_meal[link.meal_id].append((link, ingredient))
    for result in food_results:
        food_results_by_meal[result.meal_id].append(result)
    for result in ingredient_results:
        ingredient_results_by_meal[result.meal_id].append(result)
    for link, suggestion in links:
        links_by_meal[link.meal_id].append((link, suggestion))
    return [
        MealRecords(
            meal,
            foods_by_meal[meal.id],
            ingredients_by_meal[meal.id],
            food_results_by_meal[meal.id],
            ingredient_results_by_meal[meal.id],
            links_by_meal[meal.id],
        )
        for meal in meals
    ]
