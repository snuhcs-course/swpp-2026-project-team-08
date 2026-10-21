# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SuggestionAction(Base):
    __tablename__ = "suggestion_actions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    suggestion_id: Mapped[str] = mapped_column(
        ForeignKey("legacy_suggestions.id", onupdate="CASCADE", ondelete="CASCADE"), index=True
    )
    before: Mapped[dict] = mapped_column(JSON)
    after_version: Mapped[int] = mapped_column(Integer)
    undone: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
