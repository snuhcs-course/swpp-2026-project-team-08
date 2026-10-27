# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow

"""Suggestions owned by the authenticated user."""

import asyncio
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.meals.queries import meal_records, owned_meal
from app.features.suggestions.generator import generate_suggestions
from app.features.suggestions.inputs import build_food_inputs
from app.features.suggestions.queries import load_child_data
from app.features.suggestions.workflow.state import GeneratedSuggestion
from app.models import UserSuggestion


class SuggestionNotFoundError(AppError):
    pass


class SourceMealNotFoundError(AppError):
    pass


class ReviewRequiredError(AppError):
    pass


class InvalidSuggestionTargetError(AppError):
    pass


class GenerationFailedError(AppError):
    pass


@dataclass(frozen=True)
class Target:
    food_id: int
    ingredient_id: int | None


class UserSuggestionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_saved(
        self, *, user_id: int, after_meal_date: date | None
    ) -> list[UserSuggestion]:
        if after_meal_date == date.max:
            return []
        stmt = select(UserSuggestion).where(
            UserSuggestion.user_id == user_id, UserSuggestion.status == "saved"
        )
        if after_meal_date is not None:
            cutoff = datetime.combine(
                after_meal_date + timedelta(days=1), time.min, tzinfo=ZoneInfo("Asia/Seoul")
            )
            stmt = stmt.where(UserSuggestion.created_at >= cutoff)
        stmt = stmt.order_by(UserSuggestion.created_at.desc(), UserSuggestion.id.desc())
        return list((await self._session.scalars(stmt)).all())

    async def list_for_meal(
        self, *, user_id: int, meal_id: int, include_all: bool
    ) -> list[UserSuggestion]:
        if await owned_meal(self._session, user_id, meal_id) is None:
            raise SourceMealNotFoundError()
        stmt = select(UserSuggestion).where(
            UserSuggestion.user_id == user_id, UserSuggestion.meal_id == meal_id
        )
        if not include_all:
            stmt = stmt.where(UserSuggestion.status == "saved")
        return list(
            (
                await self._session.scalars(
                    stmt.order_by(UserSuggestion.created_at.desc(), UserSuggestion.id.desc())
                )
            ).all()
        )

    async def generate(
        self, *, user_id: int, meal_id: int, targets: list[Target]
    ) -> list[UserSuggestion]:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise SourceMealNotFoundError()
        records = await meal_records(self._session, meal)
        if not records.food_results:
            raise ReviewRequiredError()
        reviewed_foods = {item.food_id: item for item in records.food_results}
        reviewed_ingredients = {
            (item.food_id, item.ingredient_id) for item in records.ingredient_results
        }
        requested = [(target.food_id, target.ingredient_id) for target in targets]
        if len(requested) != len(set(requested)):
            raise InvalidSuggestionTargetError()
        for target in targets:
            if target.food_id not in reviewed_foods or (
                target.ingredient_id is not None
                and (target.food_id, target.ingredient_id) not in reviewed_ingredients
            ):
                raise InvalidSuggestionTargetError()

        # AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
        inputs = build_food_inputs(
            [(target.food_id, target.ingredient_id) for target in targets],
            reviewed_foods,
            records.ingredient_results,
        )
        child = await load_child_data(self._session, user_id)
        try:
            async with asyncio.timeout(60):
                generated = await generate_suggestions(inputs, child.restrictions, child.context)
        except Exception as error:
            raise GenerationFailedError() from error
        if (
            not isinstance(generated, list)
            or len(generated) != len(targets)
            or any(not isinstance(item, GeneratedSuggestion) for item in generated)
            or {item.food_id for item in generated} != {item.id for item in inputs}
            or any(
                not isinstance(getattr(item, key), str) or not getattr(item, key).strip()
                for item in generated
                for key in ("what_to_try", "why_this_may_help")
            )
        ):
            raise GenerationFailedError()
        by_index = {item.food_id: item for item in generated}
        suggestions = []
        for index, target in enumerate(targets):
            content = by_index[str(index)]
            suggestion = UserSuggestion(
                user_id=user_id,
                meal_id=meal_id,
                food_id=target.food_id,
                ingredient_id=target.ingredient_id,
                food_snapshot=reviewed_foods[target.food_id].food_snapshot,
                what_to_try=content.what_to_try,
                why_this_may_help=content.why_this_may_help,
                serving_tip=content.serving_tip,
                status="pending",
                dismiss_reasons=[],
            )
            self._session.add(suggestion)
            suggestions.append(suggestion)
        await self._session.flush()
        return suggestions

    async def _owned(self, user_id: int, suggestion_id: int) -> UserSuggestion:
        item = await self._session.scalar(
            select(UserSuggestion)
            .where(UserSuggestion.id == suggestion_id, UserSuggestion.user_id == user_id)
            .with_for_update()
        )
        if item is None:
            raise SuggestionNotFoundError()
        return item

    async def decide(
        self, *, user_id: int, suggestion_id: int, status: str, dismiss_reasons: list[str]
    ) -> UserSuggestion:
        item = await self._owned(user_id, suggestion_id)
        item.status = status
        item.dismiss_reasons = dismiss_reasons
        item.saved_at = now_kst() if status == "saved" else None
        await self._session.flush()
        return item

    async def undo(self, *, user_id: int, suggestion_id: int) -> UserSuggestion:
        item = await self._owned(user_id, suggestion_id)
        item.status = "pending"
        item.dismiss_reasons = []
        item.saved_at = None
        await self._session.flush()
        return item
