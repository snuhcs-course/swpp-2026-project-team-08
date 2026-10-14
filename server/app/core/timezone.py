# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""시간 유틸리티.

모든 테이블의 created_at / updated_at 기본값으로 사용하는 KST 현재 시각을 제공한다.
"""

from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9), name="KST")


def now_kst() -> datetime:
    """KST(UTC+9) 기준 현재 시각을 timezone-aware datetime 으로 반환한다."""
    return datetime.now(KST)
