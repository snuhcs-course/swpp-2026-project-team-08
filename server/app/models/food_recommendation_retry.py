# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 음식별 최초 거절과 추가 추천 관계 저장
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 제거 예정 테이블로 표시

"""제거 예정. 음식별 최초 추천 거절과 선택적 추가 추천 결과.

식후 음식별 추천의 추가 생성 이력이다. 기존 이력은 보존하지만 새 추천 생성에는 쓰지 않는다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class FoodRecommendationRetry(Base):
    __tablename__ = "food_recommendation_retries"

    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meal_foods.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    dismissed_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("food_recommendations.id", onupdate="CASCADE", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    replacement_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("food_recommendations.id", onupdate="CASCADE", ondelete="CASCADE"),
        unique=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=now_kst,
        onupdate=now_kst,
    )
