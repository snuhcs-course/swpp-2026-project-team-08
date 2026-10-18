# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""식사 기록 유스케이스. HTTP/DTO 를 모른다."""

from dataclasses import asdict
from datetime import date, datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.features.meal_logs import queries
from app.features.meal_logs.link_data import InvalidMealLinkError, SuggestionLinkData
from app.features.suggestions.try_queries import confirm_linked_tries
from app.models import MealFood, MealLog, MealReview, MealSuggestion, Suggestion


class MealNotFoundError(AppError):
    def __init__(self, meal_id: str) -> None:
        super().__init__()
        self.meal_id = meal_id


class InvalidMonthError(AppError):
    def __init__(self, month: str) -> None:
        super().__init__()
        self.month = month


class MealLogService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert_meal(
        self,
        *,
        child_id: str,
        meal_id: str,
        meal_date: date,
        meal_type: str,
        setting: str,
        before_photo_uri: str | None,
        exposure_food_id: str | None,
        foods: list[dict[str, Any]],
        saved_at: datetime,
        suggestion_links: list[SuggestionLinkData] | None = None,
    ) -> MealLog:
        meal = await queries.get_meal(self._session, meal_id)
        if meal is not None and meal.child_id != child_id:
            raise MealNotFoundError(meal_id)
        # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
        links = suggestion_links or []
        if len({link.suggestion_id for link in links}) != len(links) or any(
            link.food_id not in {food["id"] for food in foods} for link in links
        ):
            raise InvalidMealLinkError()
        for link in links:
            saved_suggestion = await self._session.get(Suggestion, link.suggestion_id)
            if saved_suggestion is not None and (
                saved_suggestion.child_id != child_id or saved_suggestion.saved_at is None
            ):
                raise InvalidMealLinkError()
        if meal is None:
            meal = MealLog(id=meal_id, child_id=child_id)
            self._session.add(meal)
        meal.suggestion_links = [asdict(link) for link in links]
        meal.meal_date = meal_date
        meal.meal_type = meal_type
        meal.setting = setting
        meal.before_photo_uri = before_photo_uri
        meal.exposure_food_id = exposure_food_id
        meal.saved_at = saved_at
        await self._session.flush()
        await self._session.execute(delete(MealFood).where(MealFood.meal_id == meal_id))
        await self._session.flush()
        for index, food in enumerate(foods):
            self._session.add(
                MealFood(
                    id=food["id"],
                    meal_id=meal_id,
                    position=index,
                    name=food["name"],
                    preparation=food.get("preparation") or "",
                    serving_note=food.get("serving_note") or "",
                    ingredients=list(food.get("ingredients") or []),
                    traits=dict(food.get("traits") or {}),
                    history=food.get("history"),
                    source=food["source"],
                    acceptance=food.get("acceptance"),
                    origin=food.get("origin"),
                )
            )
        await self._session.flush()
        return await self.get_owned(child_id, meal_id)

    async def list_for_child(self, *, child_id: str, meal_date: date | None) -> list[MealLog]:
        return await queries.list_meals(self._session, child_id=child_id, meal_date=meal_date)

    async def calendar(self, *, child_id: str, month: str) -> list[tuple[date, int]]:
        start, end = _month_bounds(month)
        return await queries.calendar_counts(self._session, child_id=child_id, start=start, end=end)

    async def get_owned(self, child_id: str, meal_id: str) -> MealLog:
        meal = await queries.get_meal(self._session, meal_id)
        if meal is None or meal.child_id != child_id:
            raise MealNotFoundError(meal_id)
        return meal

    async def save_review(
        self,
        *,
        child_id: str,
        meal_id: str,
        after_photo_uri: str,
        outcomes: list[dict[str, Any]],
        difficulties: dict[str, Any],
        goal_feedback: str | None,
        saved_at: datetime,
        suggestion_feedback: dict[str, str] | None = None,
    ) -> MealLog:
        # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
        await self._session.execute(
            select(MealLog.id).where(MealLog.id == meal_id).with_for_update()
        )
        meal = await self.get_owned(child_id, meal_id)
        feedback = suggestion_feedback or {}
        if set(feedback) - {link["suggestion_id"] for link in meal.suggestion_links}:
            raise InvalidMealLinkError()
        review = await self._session.get(MealReview, meal_id)
        if review is None:
            review = MealReview(meal_id=meal_id)
            self._session.add(review)
        review.after_photo_uri = after_photo_uri
        review.outcomes = outcomes
        review.difficulties = difficulties
        review.suggestion_feedback = feedback
        review.goal_feedback = goal_feedback
        review.saved_at = saved_at
        await self._session.flush()
        await confirm_linked_tries(self._session, meal, feedback)
        await self._session.refresh(meal, ["review"])
        return await self.get_owned(child_id, meal_id)

    async def save_suggestion(
        self,
        *,
        child_id: str,
        meal_id: str,
        suggestion_id: str,
        food_id: str,
        title: str,
        description: str,
        serving_tip: str | None,
        ingredients: list[str],
    ) -> MealSuggestion:
        meal = await self.get_owned(child_id, meal_id)
        existing = await queries.get_suggestion(self._session, suggestion_id)
        if existing is not None:
            if existing.meal_id != meal.id:
                raise MealNotFoundError(meal_id)
            return existing
        suggestion = MealSuggestion(
            id=suggestion_id,
            meal_id=meal_id,
            food_id=food_id,
            title=title,
            description=description,
            serving_tip=serving_tip,
            ingredients=ingredients,
        )
        self._session.add(suggestion)
        await self._session.flush()
        await self._session.refresh(suggestion)
        return suggestion

    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    async def linked_suggestions(self, meal: MealLog) -> list[queries.LinkedSuggestion]:
        return await queries.linked_suggestions(self._session, meal)

    async def delete(self, *, child_id: str, meal_id: str) -> None:
        meal = await self.get_owned(child_id, meal_id)
        await self._session.delete(meal)
        await self._session.flush()


def _month_bounds(month: str) -> tuple[date, date]:
    parts = month.split("-")
    if (
        len(parts) != 2
        or len(parts[0]) != 4
        or len(parts[1]) != 2
        or not all(part.isdigit() for part in parts)
    ):
        raise InvalidMonthError(month)
    year, month_number = int(parts[0]), int(parts[1])
    if month_number < 1 or month_number > 12 or year < 1900 or year > 2200:
        raise InvalidMonthError(month)
    start = date(year, month_number, 1)
    if month_number == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month_number + 1, 1)
    return start, end
