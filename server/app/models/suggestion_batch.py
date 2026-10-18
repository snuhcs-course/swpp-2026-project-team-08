# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
from datetime import datetime

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SuggestionBatch(Base):
    __tablename__ = "suggestion_batches"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    child_id: Mapped[str] = mapped_column(String(80), index=True)
    meal_id: Mapped[str] = mapped_column(String(80), index=True)
    revision: Mapped[str] = mapped_column(String(64))
    selected_food_ids: Mapped[list[str]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
