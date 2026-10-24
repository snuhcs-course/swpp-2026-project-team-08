# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""클라이언트와 같은 ID를 쓰는 고정 제한 목록."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class Restriction(Base):
    __tablename__ = "restrictions"
    __table_args__ = (
        CheckConstraint("trim(id) <> ''", name="ck_restrictions_id"),
        CheckConstraint("trim(name) <> ''", name="ck_restrictions_name"),
        CheckConstraint("type IN ('ALLERGY','DIET','APPROACH')", name="ck_restrictions_type"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
