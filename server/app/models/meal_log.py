# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""저장된 식사 기록 (meal_logs)."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.meal_food import MealFood
    from app.models.meal_review import MealReview
    from app.models.meal_suggestion import MealSuggestion


class MealLog(Base):
    __tablename__ = "meal_logs"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    meal_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    setting: Mapped[str] = mapped_column(String(20), nullable=False)
    before_photo_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    exposure_food_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    foods: Mapped[list["MealFood"]] = relationship(
        back_populates="meal",
        cascade="all, delete-orphan",
        order_by="MealFood.position",
        lazy="selectin",
    )
    review: Mapped["MealReview | None"] = relationship(
        back_populates="meal",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )
    suggestions: Mapped[list["MealSuggestion"]] = relationship(
        back_populates="meal",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
