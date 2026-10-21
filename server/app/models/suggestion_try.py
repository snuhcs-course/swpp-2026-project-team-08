# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SuggestionTry(Base):
    __tablename__ = "suggestion_tries"

    __table_args__ = (UniqueConstraint("suggestion_id", "meal_id", "target_id"),)
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    suggestion_id: Mapped[str] = mapped_column(
        ForeignKey("legacy_suggestions.id", onupdate="CASCADE", ondelete="CASCADE"), index=True
    )
    meal_id: Mapped[str] = mapped_column(String(80), index=True)
    target_id: Mapped[str] = mapped_column(String(200))
    tried_on: Mapped[date] = mapped_column(Date)
    feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
