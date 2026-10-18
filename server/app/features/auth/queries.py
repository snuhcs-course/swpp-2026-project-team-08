# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
"""계정 삭제 시 아이 소유의 식사·추천 행을 지운다."""

from collections.abc import Sequence

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MealLog, Suggestion, SuggestionBatch


async def delete_child_owned_rows(session: AsyncSession, child_ids: Sequence[str]) -> None:
    ids = [child_id for child_id in child_ids if child_id]
    if not ids:
        return
    await session.execute(delete(Suggestion).where(Suggestion.child_id.in_(ids)))
    await session.execute(delete(SuggestionBatch).where(SuggestionBatch.child_id.in_(ids)))
    await session.execute(delete(MealLog).where(MealLog.child_id.in_(ids)))
