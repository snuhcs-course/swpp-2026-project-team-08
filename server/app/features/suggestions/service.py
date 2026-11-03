# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 FoodRecommendation, 프로필 제한과 DB 카탈로그, TRIED 상태 처리로 재작성

"""인증된 사용자의 음식 추천을 만들고 조회하고 결정한다."""

import asyncio
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.meals.queries import meal_records, owned_meal
from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.generator import generate_suggestions
from app.features.suggestions.ingredients import ChildRestrictions
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from app.models import FoodRecommendation, MealFood, UserProfile
from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)
from app.models.restriction_enums import RestrictionType

# 목록에 보이는 추천. 시도한(TRIED) 추천도 저장한 추천과 함께 계속 보인다.
LISTED_STATUSES = (FoodRecommendationStatus.SAVED, FoodRecommendationStatus.TRIED)


class SuggestionNotFoundError(AppError):
    pass


class SourceMealNotFoundError(AppError):
    pass


class ReviewRequiredError(AppError):
    pass


class InvalidSuggestionTargetError(AppError):
    pass


class ProfileRequiredError(AppError):
    pass


class RecommendationTriedError(AppError):
    pass


class GenerationFailedError(AppError):
    pass


@dataclass(frozen=True)
class RecommendationRecord:
    """추천과, 그 추천의 근거 음식이 속한 식사의 id."""

    item: FoodRecommendation
    meal_id: int


class FoodRecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_saved(
        self, *, user_id: int, after_meal_date: date | None
    ) -> list[RecommendationRecord]:
        if after_meal_date == date.max:
            return []
        stmt = (
            select(FoodRecommendation, MealFood.meal_id)
            .join(MealFood, FoodRecommendation.origin_food_id == MealFood.id)
            .where(
                FoodRecommendation.user_id == user_id,
                FoodRecommendation.status.in_(LISTED_STATUSES),
            )
        )
        if after_meal_date is not None:
            cutoff = datetime.combine(
                after_meal_date + timedelta(days=1), time.min, tzinfo=ZoneInfo("Asia/Seoul")
            )
            stmt = stmt.where(FoodRecommendation.created_at >= cutoff)
        stmt = stmt.order_by(FoodRecommendation.created_at.desc(), FoodRecommendation.id.desc())
        return [
            RecommendationRecord(item, meal_id)
            for item, meal_id in (await self._session.execute(stmt)).all()
        ]

    async def list_for_meal(
        self, *, user_id: int, meal_id: int, include_all: bool
    ) -> list[RecommendationRecord]:
        if await owned_meal(self._session, user_id, meal_id) is None:
            raise SourceMealNotFoundError()
        stmt = (
            select(FoodRecommendation)
            .join(MealFood, FoodRecommendation.origin_food_id == MealFood.id)
            .where(FoodRecommendation.user_id == user_id, MealFood.meal_id == meal_id)
        )
        if not include_all:
            stmt = stmt.where(FoodRecommendation.status.in_(LISTED_STATUSES))
        stmt = stmt.order_by(FoodRecommendation.created_at.desc(), FoodRecommendation.id.desc())
        return [
            RecommendationRecord(item, meal_id)
            for item in (await self._session.scalars(stmt)).all()
        ]

    async def generate(
        self, *, user_id: int, meal_id: int, food_ids: list[int]
    ) -> list[RecommendationRecord]:
        meal = await owned_meal(self._session, user_id, meal_id)
        if meal is None:
            raise SourceMealNotFoundError()
        records = await meal_records(self._session, meal)
        if all(item.food.outcome is None for item in records.foods):
            raise ReviewRequiredError()
        by_id = {item.food.id: item for item in records.foods}
        if len(food_ids) != len(set(food_ids)) or any(
            food_id not in by_id or by_id[food_id].food.outcome is None for food_id in food_ids
        ):
            raise InvalidSuggestionTargetError()

        restrictions = await self._child_restrictions(user_id)
        catalog = await load_catalog(self._session, restrictions)
        inputs = [
            FoodInput(
                id=str(index),
                name=by_id[food_id].food.name,
                ingredients=tuple(item.name for item in by_id[food_id].ingredients),
                cooking_method=(
                    by_id[food_id].food.cooking_method.value
                    if by_id[food_id].food.cooking_method
                    else None
                ),
                outcome=by_id[food_id].food.outcome.value,
                difficulty_reasons=tuple(by_id[food_id].food.difficulty_reasons),
            )
            for index, food_id in enumerate(food_ids)
        ]
        try:
            async with asyncio.timeout(60):
                generated = await generate_suggestions(inputs, catalog)
        except Exception as error:
            raise GenerationFailedError() from error
        if (
            not isinstance(generated, list)
            or len(generated) != len(food_ids)
            or any(not isinstance(item, GeneratedSuggestion) for item in generated)
            or {item.food_id for item in generated} != {item.id for item in inputs}
            or any(
                not isinstance(getattr(item, key), str) or not getattr(item, key).strip()
                for item in generated
                for key in ("what_to_try", "why_this_may_help", "causes")
            )
        ):
            raise GenerationFailedError()
        by_index = {item.food_id: item for item in generated}
        created = []
        for index, food_id in enumerate(food_ids):
            content = by_index[str(index)]
            recommendation = FoodRecommendation(
                user_id=user_id,
                origin_food_id=food_id,
                what_to_try=content.what_to_try,
                why_this_may_help=content.why_this_may_help,
                serving_tip=content.serving_tip,
                ingredients=list(content.ingredients),
                cooking_method=content.cooking_method,
                causes=content.causes,
                status=FoodRecommendationStatus.PENDING,
                dismiss_reasons=[],
            )
            self._session.add(recommendation)
            created.append(recommendation)
        await self._session.flush()
        return [RecommendationRecord(item, meal_id) for item in created]

    async def decide(
        self,
        *,
        user_id: int,
        suggestion_id: int,
        status: FoodRecommendationStatus,
        dismiss_reasons: list[FoodRecommendationDismissReason],
    ) -> RecommendationRecord:
        item = await self._owned(user_id, suggestion_id)
        item.status = status
        item.dismiss_reasons = [reason.value for reason in dismiss_reasons]
        item.saved_at = now_kst() if status == FoodRecommendationStatus.SAVED else None
        await self._session.flush()
        return await self._record(item)

    async def undo(self, *, user_id: int, suggestion_id: int) -> RecommendationRecord:
        item = await self._owned(user_id, suggestion_id)
        item.status = FoodRecommendationStatus.PENDING
        item.dismiss_reasons = []
        item.saved_at = None
        await self._session.flush()
        return await self._record(item)

    async def _child_restrictions(self, user_id: int) -> ChildRestrictions:
        """프로필의 restrictions 에서 ALLERGY.NONE 을 뺀 값이 아이의 제한이다."""
        profile = await self._session.scalar(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        if profile is None:
            raise ProfileRequiredError()
        types = {RestrictionType(value) for value in profile.restrictions}
        return ChildRestrictions(types=frozenset(types - {RestrictionType.ALLERGY_NONE}))

    async def _owned(self, user_id: int, suggestion_id: int) -> FoodRecommendation:
        item = await self._session.scalar(
            select(FoodRecommendation)
            .where(FoodRecommendation.id == suggestion_id, FoodRecommendation.user_id == user_id)
            .with_for_update()
        )
        if item is None:
            raise SuggestionNotFoundError()
        # 시도한 추천은 시도 기록과 일관되어야 하므로 결정을 바꿀 수 없다.
        if item.status == FoodRecommendationStatus.TRIED:
            raise RecommendationTriedError()
        return item

    async def _record(self, item: FoodRecommendation) -> RecommendationRecord:
        meal_id = await self._session.scalar(
            select(MealFood.meal_id).where(MealFood.id == item.origin_food_id)
        )
        return RecommendationRecord(item, int(meal_id))
