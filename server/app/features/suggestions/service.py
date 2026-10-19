# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Recommendation generation, decisions, saved snapshots, and try records."""

import asyncio
from uuid import NAMESPACE_URL, uuid4, uuid5

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.meal_logs import queries as meal_queries
from app.features.suggestions import mock
from app.features.suggestions.rules import revision_for, targets_for, utc
from app.models import MealLog, Suggestion, SuggestionAction, SuggestionBatch, SuggestionTry


class SuggestionNotFoundError(AppError):
    pass


class SourceUnavailableError(AppError):
    pass


class SelectionChangedError(AppError):
    pass


class SuggestionConflictError(AppError):
    pass


class GenerationFailedError(AppError):
    pass


class SuggestionService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def source(self, child_id: str, meal_id: str):
        # The source row serializes generation/selection changes, including first creation.
        await self.session.execute(
            select(MealLog.id).where(MealLog.id == meal_id).with_for_update()
        )
        meal = await meal_queries.get_meal(self.session, meal_id)
        if meal is None or meal.child_id != child_id:
            raise SourceUnavailableError()
        return meal

    async def item(self, child_id: str, suggestion_id: str) -> Suggestion:
        item = await self.session.scalar(
            select(Suggestion)
            .where(Suggestion.id == suggestion_id, Suggestion.child_id == child_id)
            .with_for_update()
        )
        if item is None:
            raise SuggestionNotFoundError()
        return item

    async def batch(self, child_id: str, meal_id: str, selected: list[str] | None):
        meal = await self.source(child_id, meal_id)
        if meal.review is None:
            raise SourceUnavailableError()
        revision = revision_for(meal)
        batch_id = str(uuid5(NAMESPACE_URL, f"suggestions:{child_id}:{meal_id}"))
        batch = await self.session.get(SuggestionBatch, batch_id)
        if batch is None:
            batch = SuggestionBatch(
                id=batch_id,
                child_id=child_id,
                meal_id=meal_id,
                revision=revision,
                selected_food_ids=[],
            )
            self.session.add(batch)
        changed = batch.revision != revision
        if selected is None:
            selected = batch.selected_food_ids if not changed else []
            if not selected:
                # AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
                selected = [food.id for food in meal.foods[:3]]
        foods = {f.id: f for f in meal.foods}
        if (
            not 1 <= len(selected) <= 3
            or len(set(selected)) != len(selected)
            or any(f not in foods for f in selected)
        ):
            raise SelectionChangedError()
        existing = list(
            (
                await self.session.scalars(
                    select(Suggestion).where(
                        Suggestion.batch_id == batch_id, Suggestion.revision == revision
                    )
                )
            ).all()
        )
        known = {s.food_id for s in existing}
        missing = [foods[f] for f in selected if f not in known]
        if missing:
            try:
                async with asyncio.timeout(60):
                    generated = await mock.generate_suggestions(
                        [{"id": f.id, "name": f.name} for f in missing]
                    )
            except Exception as error:
                raise GenerationFailedError() from error
            if (
                not isinstance(generated, list)
                or any(not isinstance(r, dict) for r in generated)
                or len(generated) != len(missing)
                or {r.get("food_id") for r in generated} != {f.id for f in missing}
                or any(
                    not isinstance(r.get(key), str) or not r[key].strip()
                    for r in generated
                    for key in ("what_to_try", "why_this_may_help", "serving_tip")
                )
            ):
                raise GenerationFailedError()
            for result in generated:
                food = foods[result["food_id"]]
                item = Suggestion(
                    id=str(uuid5(NAMESPACE_URL, f"{batch_id}:{revision}:{food.id}")),
                    child_id=child_id,
                    batch_id=batch_id,
                    meal_id=meal_id,
                    food_id=food.id,
                    revision=revision,
                    content={
                        **result,
                        "food_name": food.name,
                        "ingredients": food.ingredients,
                        "preparation": food.preparation,
                        "meal_date": meal.meal_date.isoformat(),
                        "meal_type": meal.meal_type,
                        "linked_reason": meal.review.difficulties.get(food.id, []),
                    },
                )
                self.session.add(item)
                existing.append(item)
        batch.revision = revision
        batch.selected_food_ids = list(selected)
        await self.session.flush()
        return batch, [next(s for s in existing if s.food_id == f) for f in selected]

    async def decide(
        self,
        child_id: str,
        suggestion_id: str,
        *,
        action_id: str,
        version: int,
        status: str,
        reasons: list[str],
    ):
        item = await self.item(child_id, suggestion_id)
        action = await self.session.get(SuggestionAction, action_id)
        if action:
            if action.suggestion_id != item.id or action.undone:
                raise SuggestionConflictError()
            return item
        meal = await self.source(child_id, item.meal_id)
        if item.version != version or revision_for(meal) != item.revision:
            raise SuggestionConflictError()
        action = SuggestionAction(
            id=action_id,
            suggestion_id=item.id,
            before={
                "status": item.status,
                "reasons": item.dismiss_reasons,
                "saved_at": item.saved_at.isoformat() if item.saved_at else None,
            },
            after_version=item.version + 1,
        )
        self.session.add(action)
        item.status = status
        item.dismiss_reasons = reasons if status == "dismissed" else []
        if status == "saved" and item.saved_at is None:
            item.saved_at = now_kst()
        item.version += 1
        await self.session.flush()
        return item

    async def undo(self, child_id: str, suggestion_id: str, action_id: str):
        item = await self.item(child_id, suggestion_id)
        action = await self.session.get(SuggestionAction, action_id)
        if action is None or action.suggestion_id != item.id:
            raise SuggestionConflictError()
        if action.undone:
            return item
        if item.version != action.after_version:
            raise SuggestionConflictError()
        before = action.before
        item.status = before["status"]
        item.dismiss_reasons = before["reasons"]
        # Undo only the save created by this action; try rows are never removed.
        if before["saved_at"] is None and item.status != "saved":
            item.saved_at = None
        item.version += 1
        action.undone = True
        await self.session.flush()
        return item

    async def saved(self, child_id: str):
        return list(
            (
                await self.session.scalars(
                    select(Suggestion)
                    .where(Suggestion.child_id == child_id, Suggestion.saved_at.is_not(None))
                    .order_by(Suggestion.saved_at.desc())
                )
            ).all()
        )

    async def set_saved(self, child_id: str, suggestion_id: str, saved: bool):
        item = await self.item(child_id, suggestion_id)
        item.saved_at = (item.saved_at or now_kst()) if saved else None
        item.version += 1
        await self.session.flush()
        return item

    async def eligible(self, child_id: str, suggestion_id: str):
        item = await self.item(child_id, suggestion_id)
        if item.saved_at is None:
            raise SuggestionNotFoundError()
        meals = await meal_queries.list_meals(self.session, child_id=child_id, meal_date=None)
        return [m for m in meals if utc(m.created_at) >= utc(item.created_at)]

    async def record_try(self, child_id: str, suggestion_id: str, *, meal_id: str, target_id: str):
        item = await self.item(child_id, suggestion_id)
        if item.saved_at is None:
            raise SuggestionNotFoundError()
        meal = await self.source(child_id, meal_id)
        if utc(meal.created_at) < utc(item.created_at) or target_id not in {
            t["id"] for t in targets_for(meal)
        }:
            raise SelectionChangedError()
        existing = await self.session.scalar(
            select(SuggestionTry).where(
                SuggestionTry.suggestion_id == item.id,
                SuggestionTry.meal_id == meal_id,
                SuggestionTry.target_id == target_id,
            )
        )
        if existing:
            return existing
        tried = SuggestionTry(
            id=str(uuid4()),
            suggestion_id=item.id,
            meal_id=meal_id,
            target_id=target_id,
            tried_on=meal.meal_date,
        )
        self.session.add(tried)
        await self.session.flush()
        return tried

    async def feedback(self, child_id: str, suggestion_id: str, try_id: str, feedback: str):
        await self.item(child_id, suggestion_id)
        tried = await self.session.get(SuggestionTry, try_id)
        if tried is None or tried.suggestion_id != suggestion_id:
            raise SuggestionNotFoundError()
        tried.feedback = feedback
        await self.session.flush()
        return tried

    async def tries(self, suggestion_id: str):
        return list(
            (
                await self.session.scalars(
                    select(SuggestionTry)
                    .where(SuggestionTry.suggestion_id == suggestion_id)
                    .order_by(SuggestionTry.tried_on.desc(), SuggestionTry.created_at.desc())
                )
            ).all()
        )
