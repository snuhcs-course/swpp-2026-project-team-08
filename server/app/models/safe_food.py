"""Foods the child reliably accepts."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SafeFood(Base):
    __tablename__ = "safe_foods"
    __table_args__ = (
        UniqueConstraint("user_id", "position", name="uq_safe_foods_user_position"),
        CheckConstraint("position >= 0", name="ck_safe_foods_position"),
        CheckConstraint("trim(name) <> ''", name="ck_safe_foods_name"),
        CheckConstraint("trim(preparation) <> ''", name="ck_safe_foods_preparation"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("user_profiles.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    preparation: Mapped[str] = mapped_column(String, nullable=False)
    presentation_note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
