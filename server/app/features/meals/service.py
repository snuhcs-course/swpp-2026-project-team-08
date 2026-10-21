"""Save an authenticated meal and its resolved ingredients."""

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.ingredients.queries import resolve_ingredient
from app.features.meals.data import MealData
from app.models import FoodItem, Meal, MealFoodIngredient, SuggestionMealLink, UserSuggestion


class IngredientNotFoundError(AppError):
    pass


class DuplicateIngredientError(AppError):
    pass


class InvalidSuggestionLinkError(AppError):
    pass


@dataclass(frozen=True)
class ResolvedFood:
    id: str
    name: str
    ingredient_ids: list[int]
    cooking_method: str | None
    serving_note: str | None
    acceptance: int | None


class MealService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def write(self, *, user_id: int, data: MealData) -> Meal:
        foods: list[ResolvedFood] = []
        for food in data.foods:
            ingredient_ids: list[int] = []
            for item in food.ingredients:
                ingredient = await resolve_ingredient(
                    self._session, ingredient_id=item.id, name=item.name
                )
                if ingredient is None:
                    raise IngredientNotFoundError()
                ingredient_ids.append(ingredient.id)
            if len(ingredient_ids) != len(set(ingredient_ids)):
                raise DuplicateIngredientError()
            foods.append(
                ResolvedFood(
                    id=food.id,
                    name=food.name,
                    ingredient_ids=ingredient_ids,
                    cooking_method=food.cooking_method,
                    serving_note=food.serving_note,
                    acceptance=food.acceptance,
                )
            )

        food_ids = {food.id for food in foods}
        ingredients_by_food = {food.id: set(food.ingredient_ids) for food in foods}
        linked_suggestions: set[str] = set()
        for link in data.suggestion_links:
            if link.food_id not in food_ids or link.suggestion_id in linked_suggestions:
                raise InvalidSuggestionLinkError()
            if (
                link.ingredient_id is not None
                and int(link.ingredient_id) not in ingredients_by_food[link.food_id]
            ):
                raise InvalidSuggestionLinkError()
            suggestion = await self._session.get(UserSuggestion, int(link.suggestion_id))
            if (
                suggestion is None
                or suggestion.user_id != user_id
                or suggestion.status != "saved"
            ):
                raise InvalidSuggestionLinkError()
            linked_suggestions.add(link.suggestion_id)

        meal = Meal(
            user_id=user_id,
            meal_date=data.meal_date,
            meal_type=data.meal_type,
            setting=data.setting,
            before_photo_uri=data.before_photo_uri,
            after_photo_uri=None,
            saved_at=now_kst(),
        )
        self._session.add(meal)
        await self._session.flush()
        for food in foods:
            self._session.add(
                FoodItem(
                    id=int(food.id),
                    meal_id=meal.id,
                    name=food.name,
                    cooking_method=food.cooking_method,
                    serving_note=food.serving_note,
                    acceptance=food.acceptance,
                )
            )
            for ingredient_id in food.ingredient_ids:
                self._session.add(
                    MealFoodIngredient(
                        meal_id=meal.id, food_id=int(food.id), ingredient_id=ingredient_id
                    )
                )
        for link in data.suggestion_links:
            self._session.add(
                SuggestionMealLink(
                    meal_id=meal.id,
                    suggestion_id=int(link.suggestion_id),
                    food_id=int(link.food_id),
                    ingredient_id=int(link.ingredient_id) if link.ingredient_id else None,
                )
            )
        await self._session.flush()
        return meal
