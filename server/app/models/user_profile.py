# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 제한 상태 컬럼을 restrictions 목록으로 합치고 age_group 을 StrEnum 으로 변경

"""계정당 하나의 자녀 프로필."""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.user_profile_enums import AgeGroup


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
        autoincrement=False,
    )
    child_name: Mapped[str] = mapped_column(String, nullable=False)
    age_group: Mapped[AgeGroup] = mapped_column(
        Enum(AgeGroup, native_enum=False, create_constraint=False, length=20), nullable=False
    )
    # 알러지, 채식, 식이 제한을 한 목록에 담는다. 원소는 RestrictionType 값이다.
    # ALLERGY.* 값이 최소 하나 있어야 하며(알러지 없음은 ALLERGY.NONE),
    # 검증은 DTO 와 서비스가 맡는다.
    restrictions: Mapped[list[str]] = mapped_column(StringList, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
