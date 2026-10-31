# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: SuggestionMealLink 를 FoodRecommendationTry 로 바꾸고 추천 시도 기록으로 재편

"""추천을 시도한 기록.

`food_id` 는 추천을 시도한 식사의 음식이다.
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst
from app.models.food_recommendation_enums import FoodRecommendationFeedback


class FoodRecommendationTry(Base):
    __tablename__ = "food_recommendation_tries"
    __table_args__ = (
        UniqueConstraint(
            "food_recommendation_id", "food_id", name="uq_food_recommendation_tries_pair"
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    food_recommendation_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("food_recommendations.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meal_foods.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    feedback: Mapped[FoodRecommendationFeedback | None] = mapped_column(
        Enum(FoodRecommendationFeedback, native_enum=False, create_constraint=False, length=20),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
