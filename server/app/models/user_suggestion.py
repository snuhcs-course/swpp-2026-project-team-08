"""Suggestion generated from an authenticated meal review."""

from datetime import datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst

JsonData = JSON().with_variant(JSONB, "postgresql")


class UserSuggestion(Base):
    __tablename__ = "suggestions"
    __table_args__ = (
        CheckConstraint("id > 0", name="ck_suggestions_id_positive"),
        CheckConstraint("status IN ('pending','saved','dismissed')", name="ck_suggestions_status"),
        CheckConstraint(
            "(status = 'saved') = (saved_at IS NOT NULL)",
            name="ck_suggestions_saved_at",
        ),
        CheckConstraint("trim(what_to_try) <> ''", name="ck_suggestions_what_to_try"),
        CheckConstraint("trim(why_this_may_help) <> ''", name="ck_suggestions_why_this_may_help"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), nullable=False
    )
    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), nullable=False
    )
    ingredient_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), nullable=True
    )
    food_snapshot: Mapped[dict] = mapped_column(JsonData, nullable=False)
    what_to_try: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_may_help: Mapped[str] = mapped_column(Text, nullable=False)
    serving_tip: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    dismiss_reasons: Mapped[list[str]] = mapped_column(
        JsonData, nullable=False, default=list, server_default=text("'[]'")
    )
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
