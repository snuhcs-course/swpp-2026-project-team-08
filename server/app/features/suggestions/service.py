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
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 식후 음식별 생성·추가 생성을 프로필 기반 홈 화면 추천 생성으로 대체

"""인증된 사용자의 음식 추천을 만들고 조회하고 결정한다."""

import asyncio
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.difficulties import load_difficult_foods
from app.features.suggestions.familiar import load_familiar_foods
from app.features.suggestions.generator import generate_suggestions
from app.features.suggestions.history import load_history
from app.features.suggestions.ingredients import ChildRestrictions
from app.features.suggestions.workflow.restrictions import describe_restrictions
from app.features.suggestions.workflow.state import GeneratedSuggestion
from app.models import FoodRecommendation, MealFood, UserProfile
from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)
from app.models.meal_enums import MealCookingMethod
from app.models.restriction_enums import RestrictionType

# 한 번의 요청으로 만드는 추천 개수.
SUGGESTION_COUNT = 3
# 추천 생성(LLM 호출과 가드레일 판정)을 기다리는 최대 시간(초).
GENERATION_TIMEOUT_SECONDS = 60
# 보관 해제하지 않은 저장·시도 상태의 추천을 목록에 표시한다.
LISTED_STATUSES = (FoodRecommendationStatus.SAVED, FoodRecommendationStatus.TRIED)


class SuggestionNotFoundError(AppError):
    pass


class ProfileRequiredError(AppError):
    pass


class RecommendationTriedError(AppError):
    pass


class GenerationFailedError(AppError):
    pass


class FoodRecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_saved(
        self, *, user_id: int, after_meal_date: date | None
    ) -> list[FoodRecommendation]:
        if after_meal_date == date.max:
            return []
        stmt = select(FoodRecommendation).where(
            FoodRecommendation.user_id == user_id,
            FoodRecommendation.status.in_(LISTED_STATUSES),
            FoodRecommendation.removed_from_saved_at.is_(None),
        )
        if after_meal_date is not None:
            cutoff = datetime.combine(
                after_meal_date + timedelta(days=1), time.min, tzinfo=ZoneInfo("Asia/Seoul")
            )
            stmt = stmt.where(FoodRecommendation.created_at >= cutoff)
        stmt = stmt.order_by(FoodRecommendation.created_at.desc(), FoodRecommendation.id.desc())
        return list((await self._session.scalars(stmt)).all())

    async def generate(self, *, user_id: int) -> list[FoodRecommendation]:
        """프로필과 기록을 읽어 추천 `SUGGESTION_COUNT`개를 만들고 저장한다.

        생성·검증에 실패하면 아무것도 저장하지 않고 `GenerationFailedError` 를 던진다.
        """
        profile = await self._session.scalar(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        if profile is None:
            raise ProfileRequiredError()
        restrictions = _child_restrictions(profile)
        catalog = await load_catalog(self._session, restrictions)
        difficult_foods = await load_difficult_foods(self._session, user_id)
        familiar = await load_familiar_foods(self._session, user_id)
        history = await load_history(self._session, user_id)
        try:
            async with asyncio.timeout(GENERATION_TIMEOUT_SECONDS):
                generated = await generate_suggestions(
                    count=SUGGESTION_COUNT,
                    age_group=profile.age_group.value,
                    catalog=catalog,
                    difficult_foods=difficult_foods,
                    familiar=familiar,
                    history=history,
                    restrictions=describe_restrictions(restrictions.types),
                )
        except Exception as error:
            raise GenerationFailedError() from error
        if (
            not isinstance(generated, list)
            or len(generated) != SUGGESTION_COUNT
            or any(not isinstance(item, GeneratedSuggestion) for item in generated)
            or any(
                not isinstance(getattr(item, key), str) or not getattr(item, key).strip()
                for item in generated
                for key in ("what_to_try", "why_this_may_help", "preparation_method")
            )
        ):
            raise GenerationFailedError()
        created = [
            FoodRecommendation(
                user_id=user_id,
                origin_food_id=None,
                what_to_try=item.what_to_try,
                why_this_may_help=item.why_this_may_help,
                serving_tip=item.preparation_method,
                ingredients=list(item.ingredients),
                # 제거 예정 컬럼이라 NOT NULL 을 채우는 고정 값만 넣는다.
                cooking_method=MealCookingMethod.OTHER,
                causes="",
                status=FoodRecommendationStatus.PENDING,
                dismiss_reasons=[],
            )
            for item in generated
        ]
        self._session.add_all(created)
        await self._session.flush()
        return created

    async def decide(
        self,
        *,
        user_id: int,
        suggestion_id: int,
        status: FoodRecommendationStatus,
        dismiss_reasons: list[FoodRecommendationDismissReason],
    ) -> FoodRecommendation:
        item = await self._owned_for_decision(user_id, suggestion_id)
        item.status = status
        item.dismiss_reasons = [reason.value for reason in dismiss_reasons]
        item.saved_at = now_kst() if status == FoodRecommendationStatus.SAVED else None
        if status == FoodRecommendationStatus.SAVED:
            item.removed_from_saved_at = None
        await self._session.flush()
        return item

    async def undo(self, *, user_id: int, suggestion_id: int) -> FoodRecommendation:
        item = await self._owned_for_decision(user_id, suggestion_id)
        item.status = FoodRecommendationStatus.PENDING
        item.dismiss_reasons = []
        item.saved_at = None
        await self._session.flush()
        return item

    async def remove_saved(self, *, user_id: int, suggestion_id: int) -> None:
        item = await self._owned(user_id, suggestion_id)
        if item.status in LISTED_STATUSES and item.removed_from_saved_at is None:
            item.removed_from_saved_at = now_kst()
            await self._session.flush()

    async def _owned(self, user_id: int, suggestion_id: int) -> FoodRecommendation:
        origin_food_id = await self._session.scalar(
            select(FoodRecommendation.origin_food_id).where(
                FoodRecommendation.id == suggestion_id, FoodRecommendation.user_id == user_id
            )
        )
        if origin_food_id is not None:
            # 이전 식후 음식별 추천은 식사 수정·삭제와 같은 순서(음식 → 추천)로 잠근다.
            await self._session.scalar(
                select(MealFood)
                .where(MealFood.id == origin_food_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        item = await self._session.scalar(
            select(FoodRecommendation)
            .where(FoodRecommendation.id == suggestion_id, FoodRecommendation.user_id == user_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if item is None:
            raise SuggestionNotFoundError()
        return item

    async def _owned_for_decision(self, user_id: int, suggestion_id: int) -> FoodRecommendation:
        item = await self._owned(user_id, suggestion_id)
        # 시도한 추천은 시도 기록과 일관되어야 하므로 결정을 바꿀 수 없다.
        if item.status == FoodRecommendationStatus.TRIED:
            raise RecommendationTriedError()
        return item


def _child_restrictions(profile: UserProfile) -> ChildRestrictions:
    """프로필의 restrictions 에서 ALLERGY.NONE 을 뺀 값이 아이의 제한이다."""
    types = {RestrictionType(value) for value in profile.restrictions}
    return ChildRestrictions(types=frozenset(types - {RestrictionType.ALLERGY_NONE}))
