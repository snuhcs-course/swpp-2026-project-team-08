# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Save and edit ingredients independently of the catalog
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식별 재료·음식 안 리뷰 결과·추천 시도 기준으로 저장, 수정, 리뷰 재작성

"""인증된 사용자의 식사와 음식, 재료, 식후 리뷰를 저장한다."""

from sqlalchemy import delete, exists, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.meals.data import FoodData, MealData, ReviewData
from app.features.meals.queries import (
    FoodRecords,
    MealRecords,
    meal_records,
    meals_records,
    owned_meal,
)
from app.models import (
    FoodRecommendation,
    FoodRecommendationTry,
    Meal,
    MealFood,
    MealFoodIngredient,
)
from app.models.food_recommendation_enums import FoodRecommendationStatus

# 식사에 연결(시도)할 수 있는 추천. 이미 시도한 추천도 다른 식사에 다시 연결할 수 있다.
LINKABLE_STATUSES = (FoodRecommendationStatus.SAVED, FoodRecommendationStatus.TRIED)


class DuplicateIngredientError(AppError):
    pass


class InvalidRecommendationLinkError(AppError):
    pass


class InvalidFoodError(AppError):
    pass


class MealNotFoundError(AppError):
    pass


class InvalidReviewError(AppError):
    pass


class MealAlreadyReviewedError(AppError):
    pass


def _has_duplicate_ingredient(food: FoodData) -> bool:
    names = [item.name.casefold() for item in food.ingredients]
    return len(names) != len(set(names))


def _is_reviewed(records: MealRecords) -> bool:
    # outcome 이 NULL 이면 아직 리뷰하지 않은 음식이다.
    return any(item.food.outcome is not None for item in records.foods)


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
        records = await meal_records(self._session, meal)
        await self._delete_children([item.food.id for item in records.foods])
        await self._session.delete(meal)
        await self._session.flush()

    async def write(self, *, user_id: int, data: MealData) -> MealRecords:
        # 검증에 실패한 식사가 일부만 저장되지 않도록 한 단위로 묶는다.
        async with self._session.begin_nested():
            return await self._write(user_id=user_id, data=data)

    async def _write(self, *, user_id: int, data: MealData) -> MealRecords:
        if any(_has_duplicate_ingredient(food) for food in data.foods):
            raise DuplicateIngredientError()
        for food in data.foods:
            await self._check_recommendations(user_id, food.food_recommendation_ids)

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

        created = [(self._new_food(meal.id, food), food) for food in data.foods]
        await self._session.flush()
        for item, food in created:
            self._add_ingredients(item.id, food)
            for recommendation_id in food.food_recommendation_ids:
                self._session.add(
                    FoodRecommendationTry(food_recommendation_id=recommendation_id, food_id=item.id)
                )
        await self._session.flush()
        # 시도 기록이 생긴 추천은 TRIED 로 바꾼다. 두 정보의 일관성은 서비스가 지킨다.
        linked = [rid for _, food in created for rid in food.food_recommendation_ids]
        if linked:
            await self._session.execute(
                update(FoodRecommendation)
                .where(FoodRecommendation.id.in_(linked))
                .values(status=FoodRecommendationStatus.TRIED)
            )
        return await meal_records(self._session, meal)

    async def update_foods(
        self, *, user_id: int, meal_id: int, foods: list[FoodData]
    ) -> MealRecords:
        # 음식 갱신과 재료 교체가 함께 성공하거나 함께 실패해야 한다.
        async with self._session.begin_nested():
            return await self._update_foods(user_id=user_id, meal_id=meal_id, foods=foods)

    async def _update_foods(
        self, *, user_id: int, meal_id: int, foods: list[FoodData]
    ) -> MealRecords:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        records = await meal_records(self._session, meal)
        if _is_reviewed(records):
            raise MealAlreadyReviewedError()
        if any(_has_duplicate_ingredient(food) for food in foods):
            raise DuplicateIngredientError()
        existing = {item.food.id: item for item in records.foods}
        incoming_ids = {food.id for food in foods if food.id is not None}
        if not incoming_ids <= existing.keys():
            raise InvalidFoodError()

        # 요청에서 빠진 음식은 재료와 추천 시도까지 함께 지운다.
        removed = [item for food_id, item in existing.items() if food_id not in incoming_ids]
        await self._delete_children([item.food.id for item in removed])
        for item in removed:
            await self._session.delete(item.food)
        await self._session.flush()

        for food in foods:
            if food.id is None:
                created = self._new_food(meal_id, food)
                await self._session.flush()
                self._add_ingredients(created.id, food)
                continue
            self._apply(existing[food.id], food)
            await self._session.execute(
                delete(MealFoodIngredient).where(MealFoodIngredient.meal_food_id == food.id)
            )
            self._add_ingredients(food.id, food)
        await self._session.flush()
        return await meal_records(self._session, meal)

    async def review(self, *, user_id: int, meal_id: int, data: ReviewData) -> MealRecords:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise MealNotFoundError()
        records = await meal_records(self._session, meal)
        by_id = {item.food.id: item for item in records.foods}
        incoming_ids = [result.food_id for result in data.food_results]
        if len(incoming_ids) != len(by_id) or set(incoming_ids) != by_id.keys():
            raise InvalidReviewError()
        for result in data.food_results:
            allowed = {item.id for item in by_id[result.food_id].ingredients}
            selected = [item.ingredient_id for item in result.ingredient_outcomes]
            if len(selected) != len(set(selected)) or not set(selected) <= allowed:
                raise InvalidReviewError()

        meal.after_photo_uri = data.after_photo_uri
        for result in data.food_results:
            item = by_id[result.food_id]
            item.food.outcome = result.outcome
            item.food.difficulty_reasons = list(result.difficulty_reasons)
            reviewed = {value.ingredient_id: value for value in result.ingredient_outcomes}
            for ingredient in item.ingredients:
                value = reviewed.get(ingredient.id)
                # 요청에 없는 재료는 리뷰하지 않은 상태로 되돌린다.
                ingredient.outcome = value.outcome if value else None
                ingredient.difficulty_reasons = list(value.difficulty_reasons) if value else []
        await self._session.flush()
        return await meal_records(self._session, meal)

    async def _check_recommendations(self, user_id: int, recommendation_ids: list[int]) -> None:
        """연결하려는 추천이 본인의 저장된 추천인지 확인한다."""
        for recommendation_id in recommendation_ids:
            recommendation = await self._session.get(FoodRecommendation, recommendation_id)
            if (
                recommendation is None
                or recommendation.user_id != user_id
                or recommendation.status not in LINKABLE_STATUSES
            ):
                raise InvalidRecommendationLinkError()

    def _new_food(self, meal_id: int, food: FoodData) -> MealFood:
        item = MealFood(meal_id=meal_id)
        self._apply(FoodRecords(item, [], []), food)
        self._session.add(item)
        return item

    @staticmethod
    def _apply(target: FoodRecords, food: FoodData) -> None:
        target.food.name = food.name
        target.food.cooking_method = food.cooking_method
        target.food.serving_note = food.serving_note
        target.food.acceptance = food.acceptance

    def _add_ingredients(self, food_id: int, food: FoodData) -> None:
        for ingredient in food.ingredients:
            self._session.add(MealFoodIngredient(meal_food_id=food_id, name=ingredient.name))

    async def _delete_children(self, food_ids: list[int]) -> None:
        """음식에 딸린 재료, 추천 시도, 그 음식에서 나온 추천을 지운다.

        DB 의 CASCADE 에만 맡기지 않는다. 마지막 시도 기록을 잃은 추천은 SAVED 로 되돌린다.
        """
        if not food_ids:
            return
        await self._session.execute(
            delete(MealFoodIngredient).where(MealFoodIngredient.meal_food_id.in_(food_ids))
        )
        origin_ids = list(
            (
                await self._session.scalars(
                    select(FoodRecommendation.id).where(
                        FoodRecommendation.origin_food_id.in_(food_ids)
                    )
                )
            ).all()
        )
        tried_ids = set(
            (
                await self._session.scalars(
                    select(FoodRecommendationTry.food_recommendation_id).where(
                        FoodRecommendationTry.food_id.in_(food_ids)
                    )
                )
            ).all()
        )
        # 이 음식에서 나온 추천은 다른 식사에 남은 시도 기록과 함께 사라진다.
        if origin_ids:
            await self._session.execute(
                delete(FoodRecommendationTry).where(
                    FoodRecommendationTry.food_recommendation_id.in_(origin_ids)
                )
            )
            await self._session.execute(
                delete(FoodRecommendation).where(FoodRecommendation.id.in_(origin_ids))
            )
        await self._session.execute(
            delete(FoodRecommendationTry).where(FoodRecommendationTry.food_id.in_(food_ids))
        )
        reverted = tried_ids - set(origin_ids)
        if reverted:
            await self._session.execute(
                update(FoodRecommendation)
                .where(
                    FoodRecommendation.id.in_(reverted),
                    FoodRecommendation.status == FoodRecommendationStatus.TRIED,
                    ~exists().where(
                        FoodRecommendationTry.food_recommendation_id == FoodRecommendation.id
                    ),
                )
                .values(status=FoodRecommendationStatus.SAVED)
            )
