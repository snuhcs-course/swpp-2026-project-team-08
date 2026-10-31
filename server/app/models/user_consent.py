# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 동의 종류 kind 를 StrEnum 으로 바꾸고 CHECK 제약 삭제

"""사용자의 동의 기록.

기록만 추가하는(append-only) 테이블이라 `created_at`, `updated_at` 을 두지 않고
`recorded_at` 만 둔다. 테이블 규칙의 예외다.
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst
from app.models.user_consent_enums import UserConsentKind


class UserConsent(Base):
    __tablename__ = "user_consents"
    __table_args__ = (Index("ix_user_consents_user_kind", "user_id", "kind"),)

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[UserConsentKind] = mapped_column(
        Enum(UserConsentKind, native_enum=False, create_constraint=False, length=30),
        nullable=False,
    )
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    document_version: Mapped[str] = mapped_column(String, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
