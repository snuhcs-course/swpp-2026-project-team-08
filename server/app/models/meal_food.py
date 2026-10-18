# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""식사에 포함된 음식 항목 (meal_foods)."""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.meal_log import MealLog


class MealFood(Base):
    __tablename__ = "meal_foods"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    meal_id: Mapped[str] = mapped_column(
        String(80),
        ForeignKey("meal_logs.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    preparation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    serving_note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    ingredients: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    traits: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    history: Mapped[str | None] = mapped_column(String(20), nullable=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    acceptance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    origin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    meal: Mapped["MealLog"] = relationship(back_populates="foods")
