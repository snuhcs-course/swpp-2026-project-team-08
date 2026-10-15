# AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim
"""식사 음식에 연결된 저장 제안 (meal_suggestions)."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.meal_log import MealLog


class MealSuggestion(Base):
    __tablename__ = "meal_suggestions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    meal_id: Mapped[str] = mapped_column(
        String(80),
        ForeignKey("meal_logs.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    food_id: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    serving_tip: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingredients: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    meal: Mapped["MealLog"] = relationship(back_populates="suggestions")
