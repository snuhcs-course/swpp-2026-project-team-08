# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class Suggestion(Base):
    __tablename__ = "suggestions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(80), index=True)
    batch_id: Mapped[str] = mapped_column(String(80), index=True)
    meal_id: Mapped[str] = mapped_column(String(80), index=True)
    food_id: Mapped[str] = mapped_column(String(80))
    revision: Mapped[str] = mapped_column(String(64))
    # Snapshots deliberately survive deletion of the source meal or food.
    content: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    dismiss_reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
