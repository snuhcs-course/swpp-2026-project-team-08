"""Save an authenticated meal and its resolved ingredients."""

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.ingredients.queries import resolve_ingredient
from app.features.meals.data import FoodData, MealData, ReviewData
from app.features.meals.queries import MealRecords, meal_records, meals_records, owned_meal
from app.models import (
    FoodItem,
    Meal,
    MealFoodIngredient,
    ReviewFoodResult,
    ReviewIngredientResult,
    SuggestionMealLink,
    UserSuggestion,
)


class IngredientNotFoundError(AppError):
    pass


class DuplicateIngredientError(AppError):
    pass


class InvalidSuggestionLinkError(AppError):
    pass


class MealNotFoundError(AppError):
    pass


class InvalidReviewError(AppError):
    pass


class MealAlreadyReviewedError(AppError):
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

    async def get(self, *, user_id: int, meal_id: int) -> MealRecords:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        return await meal_records(self._session, meal)

    async def list_all(self, *, user_id: int) -> list[MealRecords]:
        meals = (
            await self._session.scalars(
                select(Meal)
                .where(Meal.user_id == user_id)
                .order_by(Meal.meal_date.desc(), Meal.id.desc())
            )
        ).all()
        return await meals_records(self._session, list(meals))

    async def delete(self, *, user_id: int, meal_id: int) -> None:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        await self._session.delete(meal)
        await self._session.flush()

    async def update_foods(
        self, *, user_id: int, meal_id: int, foods: list[FoodData]
    ) -> MealRecords:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        records = await meal_records(self._session, meal)
        if records.food_results:
            raise MealAlreadyReviewedError()

        resolved: dict[int, tuple[FoodData, set[int]]] = {}
        for food in foods:
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
            resolved[int(food.id)] = (food, set(ingredient_ids))

        for link, _ in records.links:
            target = resolved.get(link.food_id)
            if target is None or (
                link.ingredient_id is not None and link.ingredient_id not in target[1]
            ):
                await self._session.delete(link)
        await self._session.flush()

        for old in records.foods:
            if old.id not in resolved:
                await self._session.execute(
                    delete(MealFoodIngredient).where(
                        MealFoodIngredient.meal_id == meal_id,
                        MealFoodIngredient.food_id == old.id,
                    )
                )
                await self._session.delete(old)
        old_ingredients = {
            (link.food_id, link.ingredient_id): link for link, _ in records.ingredients
        }
        for (food_id, ingredient_id), link in old_ingredients.items():
            target = resolved.get(food_id)
            if target is not None and ingredient_id not in target[1]:
                await self._session.delete(link)
        await self._session.flush()

        existing = {food.id: food for food in records.foods}
        for food_id, (data, ingredient_ids) in resolved.items():
            item = existing.get(food_id)
            if item is None:
                item = FoodItem(id=food_id, meal_id=meal_id)
                self._session.add(item)
            item.name = data.name
            item.cooking_method = data.cooking_method
            item.serving_note = data.serving_note
            item.acceptance = data.acceptance
            for ingredient_id in ingredient_ids:
                if (food_id, ingredient_id) not in old_ingredients:
                    self._session.add(
                        MealFoodIngredient(
                            meal_id=meal_id, food_id=food_id, ingredient_id=ingredient_id
                        )
                    )
        await self._session.flush()
        return await meal_records(self._session, meal)

    async def review(self, *, user_id: int, meal_id: int, data: ReviewData) -> MealRecords:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        records = await meal_records(self._session, meal)
        foods = {food.id: food for food in records.foods}
        incoming_ids = [result.food_id for result in data.food_results]
        if len(incoming_ids) != len(foods) or set(incoming_ids) != set(foods):
            raise InvalidReviewError()
        ingredients_by_food: dict[int, list] = {food_id: [] for food_id in foods}
        for link, ingredient in records.ingredients:
            ingredients_by_food[link.food_id].append(ingredient)
        for result in data.food_results:
            allowed = {item.id for item in ingredients_by_food[result.food_id]}
            selected = [item.ingredient_id for item in result.ingredient_outcomes]
            if len(selected) != len(set(selected)) or not set(selected) <= allowed:
                raise InvalidReviewError()

        await self._session.execute(
            delete(ReviewIngredientResult).where(ReviewIngredientResult.meal_id == meal_id)
        )
        await self._session.execute(
            delete(ReviewFoodResult).where(ReviewFoodResult.meal_id == meal_id)
        )
        await self._session.flush()
        meal.after_photo_uri = data.after_photo_uri
        for result in data.food_results:
            food = foods[result.food_id]
            snapshot = {
                "name": food.name,
                "ingredients": [
                    {"id": str(item.id), "name": item.name}
                    for item in ingredients_by_food[result.food_id]
                ],
                "cooking_method": food.cooking_method,
                "serving_note": food.serving_note,
                "acceptance": food.acceptance,
            }
            self._session.add(
                ReviewFoodResult(
                    meal_id=meal_id,
                    food_id=result.food_id,
                    food_snapshot=snapshot,
                    outcome=result.outcome,
                    difficulties=result.difficulties,
                )
            )
            for item in result.ingredient_outcomes:
                self._session.add(
                    ReviewIngredientResult(
                        meal_id=meal_id,
                        food_id=result.food_id,
                        ingredient_id=item.ingredient_id,
                        outcome=item.outcome,
                        difficulties=item.difficulties,
                    )
                )
        await self._session.flush()
        return await meal_records(self._session, meal)

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
            if suggestion is None or suggestion.user_id != user_id or suggestion.status != "saved":
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
