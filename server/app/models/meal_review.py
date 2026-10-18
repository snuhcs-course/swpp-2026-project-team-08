# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""식후 리뷰 (meal_reviews). 식사당 하나."""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.meal_log import MealLog


class MealReview(Base):
    __tablename__ = "meal_reviews"

    meal_id: Mapped[str] = mapped_column(
        String(80),
        ForeignKey("meal_logs.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    after_photo_uri: Mapped[str] = mapped_column(Text, nullable=False)
    outcomes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    difficulties: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    suggestion_feedback: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    goal_feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    meal: Mapped["MealLog"] = relationship(back_populates="review")
