# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 지금까지의 추천과 보호자의 결정·거절 이유를 읽는 로더 추가

"""DB 에서 사용자에게 지금까지 만든 추천을 읽어 `PastRecommendation` 으로 만든다.

상태와 관계없이 모든 추천을 최근 것부터 읽는다. 같은 음식을 다시 추천하지 않도록 검증과
프롬프트가 함께 쓴다. 거절한 추천은 보호자가 고른 제외 이유를 함께 담는다.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.workflow.state import PastRecommendation
from app.models import FoodRecommendation

# 프롬프트가 커지지 않도록 읽는 개수를 제한한다.
HISTORY_LIMIT = 30


async def load_history(session: AsyncSession, user_id: int) -> tuple[PastRecommendation, ...]:
    """지금까지의 추천을 최근 것부터 읽는다. 추천이 없으면 빈 튜플이다."""
    rows = (
        await session.scalars(
            select(FoodRecommendation)
            .where(FoodRecommendation.user_id == user_id)
            .order_by(FoodRecommendation.created_at.desc(), FoodRecommendation.id.desc())
            .limit(HISTORY_LIMIT)
        )
    ).all()
    return tuple(
        PastRecommendation(
            what_to_try=row.what_to_try,
            status=row.status.value,
            dismiss_reasons=tuple(row.dismiss_reasons),
        )
        for row in rows
    )
