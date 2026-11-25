# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 FoodRecommendation, 프로필 제한과 DB 카탈로그, TRIED 상태 처리로 재작성
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 재료별 리뷰 결과와 아이가 잘 먹는 음식(safe food, EATEN)을 생성 입력에 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 음식별 추가 추천 1회와 재요청 결과 재사용
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 아이의 제한 설명을 추천 생성기에 전달
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 시도 이력을 보존하는 저장 목록 제거와 재저장
# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 홈 추천 한 장 생성·저장과 기존 추천의 조회·결정 지원

"""인증된 사용자의 음식 추천을 만들고 조회하고 결정한다."""

import asyncio
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.suggestions.home_generation import (
    HomeSuggestionResult,
    generate_home_suggestion,
)
from app.models import FoodRecommendation, FoodRecommendationRetry, Meal, MealFood, UserProfile
from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)
from app.models.restriction_enums import RestrictionType

# 보관 해제하지 않은 저장·시도 상태의 추천을 목록에 표시한다.
LISTED_STATUSES = (FoodRecommendationStatus.SAVED, FoodRecommendationStatus.TRIED)


class SuggestionNotFoundError(AppError):
    pass


class ProfileRequiredError(AppError):
    pass


class MealHistoryRequiredError(AppError):
    pass


class RecommendationTriedError(AppError):
    pass


class GenerationFailedError(AppError):
    pass


@dataclass(frozen=True)
class RecommendationRecord:
    """추천과 과거 추천에 연결된 원본 식사·추천 ID."""

    item: FoodRecommendation
    meal_id: int | None
    replacement_for_id: int | None = None


class FoodRecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def generate(self, *, user_id: int) -> RecommendationRecord:
        restrictions = await self._session.scalar(
            select(UserProfile.restrictions).where(UserProfile.user_id == user_id)
        )
        if not restrictions or not any(
            kind in restrictions for kind in RestrictionType if kind.category == "ALLERGY"
        ):
            raise ProfileRequiredError()
        meal_foods = select(MealFood.id).join(Meal).where(Meal.user_id == user_id)
        if not await self._session.scalar(select(meal_foods.exists())):
            raise MealHistoryRequiredError()
        try:
            async with asyncio.timeout(10):
                generated = await generate_home_suggestion(self._session, user_id=user_id)
            result = HomeSuggestionResult.model_validate(generated)
        except Exception as error:
            raise GenerationFailedError() from error

        item = FoodRecommendation(user_id=user_id, **result.model_dump())
        self._session.add(item)
        await self._session.flush()
        return RecommendationRecord(item, meal_id=None)

    @staticmethod
    def _recommendations(user_id: int):
        return (
            select(FoodRecommendation, MealFood.meal_id, FoodRecommendationRetry.dismissed_id)
            .outerjoin(MealFood, FoodRecommendation.origin_food_id == MealFood.id)
            .outerjoin(
                FoodRecommendationRetry,
                FoodRecommendationRetry.replacement_id == FoodRecommendation.id,
            )
            .where(FoodRecommendation.user_id == user_id)
        )

    async def list_saved(
        self, *, user_id: int, after_meal_date: date | None
    ) -> list[RecommendationRecord]:
        if after_meal_date == date.max:
            return []
        stmt = self._recommendations(user_id).where(
            FoodRecommendation.status.in_(LISTED_STATUSES),
            FoodRecommendation.removed_from_saved_at.is_(None),
        )
        if after_meal_date is not None:
            cutoff = datetime.combine(
                after_meal_date + timedelta(days=1), time.min, tzinfo=ZoneInfo("Asia/Seoul")
            )
            stmt = stmt.where(FoodRecommendation.created_at >= cutoff)
        stmt = stmt.order_by(FoodRecommendation.created_at.desc(), FoodRecommendation.id.desc())
        return [RecommendationRecord(*row) for row in await self._session.execute(stmt)]

    async def decide(
        self,
        *,
        user_id: int,
        suggestion_id: int,
        status: FoodRecommendationStatus,
        dismiss_reasons: list[FoodRecommendationDismissReason],
    ) -> RecommendationRecord:
        record = await self._owned_for_decision(user_id, suggestion_id)
        item = record.item
        item.status = status
        item.dismiss_reasons = [reason.value for reason in dismiss_reasons]
        item.saved_at = now_kst() if status == FoodRecommendationStatus.SAVED else None
        if status == FoodRecommendationStatus.SAVED:
            item.removed_from_saved_at = None
        await self._session.flush()
        return record

    async def undo(self, *, user_id: int, suggestion_id: int) -> RecommendationRecord:
        record = await self._owned_for_decision(user_id, suggestion_id)
        item = record.item
        item.status = FoodRecommendationStatus.PENDING
        item.dismiss_reasons = []
        item.saved_at = None
        await self._session.flush()
        return record

    async def remove_saved(self, *, user_id: int, suggestion_id: int) -> None:
        record = await self._owned(user_id, suggestion_id)
        item = record.item
        if item.status in LISTED_STATUSES and item.removed_from_saved_at is None:
            item.removed_from_saved_at = now_kst()
            await self._session.flush()

    async def _owned(self, user_id: int, suggestion_id: int) -> RecommendationRecord:
        stmt = (
            self._recommendations(user_id)
            .where(FoodRecommendation.id == suggestion_id)
            .with_for_update(of=FoodRecommendation)
            .execution_options(populate_existing=True)
        )
        row = (await self._session.execute(stmt)).one_or_none()
        if row is None:
            raise SuggestionNotFoundError()
        return RecommendationRecord(*row)

    async def _owned_for_decision(self, user_id: int, suggestion_id: int) -> RecommendationRecord:
        record = await self._owned(user_id, suggestion_id)
        if record.item.status == FoodRecommendationStatus.TRIED:
            raise RecommendationTriedError()
        return record
