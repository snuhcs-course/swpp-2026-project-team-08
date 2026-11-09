# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 음식별 최초 거절과 추가 추천 관계 저장

"""음식별 최초 추천 거절과 선택적 추가 추천 결과."""

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
