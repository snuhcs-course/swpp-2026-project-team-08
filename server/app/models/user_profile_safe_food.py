# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: SafeFood 를 UserProfileSafeFood 로 바꾸고 position 컬럼과 CHECK 제약 삭제
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 익숙한 음식의 조리 방법을 선택 입력(NULL 허용)으로 변경

"""아이가 안정적으로 먹는 음식.

순서는 저장하지 않으며 목록은 `id` 순서로 읽는다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Identity, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class UserProfileSafeFood(Base):
    __tablename__ = "user_profile_safe_foods"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("user_profiles.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    # 조리 방법은 선택 입력이다. 입력하지 않으면 NULL 이다.
    preparation: Mapped[str | None] = mapped_column(String, nullable=True)
    presentation_note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
