# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""사용자 테이블 (SQLAlchemy 2.0 typed mapping).

ORM 클래스가 도메인 객체를 겸한다. 요청/응답 모양은 각 기능의 router.py(DTO)가 맡는다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Identity, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class User(Base):
    __tablename__ = "users"
    __table_args__ = (Index("uq_users_email_lower", text("lower(email)"), unique=True),)

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
    pending_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_change_code_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_change_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
