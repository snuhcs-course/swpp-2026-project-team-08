# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 제한 상태 컬럼을 restrictions 목록으로 합치고 age_group 을 StrEnum 으로 변경
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: Dietary Pattern 선택 및 저장을 새 ERD 의 dietary_pattern StrEnum 컬럼으로 반영
# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 익숙한 음식 명시적 없음 저장 컬럼

"""계정당 하나의 자녀 프로필."""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Integer, String, false
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.user_profile_enums import AgeGroup, DietaryPattern


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
    # 식생활 유형. NULL 은 미응답이고 NO_SPECIFIC_PATTERN 은 "특정 유형 없음" 응답이다.
    dietary_pattern: Mapped[DietaryPattern | None] = mapped_column(
        Enum(DietaryPattern, native_enum=False, create_constraint=False, length=30),
        nullable=True,
    )
    # 빈 목록을 명시적 없음으로 추정하지 않는다.
    no_safe_foods: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
