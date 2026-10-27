"""One child profile per account."""

from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
class UserProfile(Base):
    __tablename__ = "user_profiles"
    __table_args__ = (
        CheckConstraint(
            "age_group IN ('under-2','2-3','4-5','6-8','9-12','13-plus')",
            name="ck_user_profiles_age_group",
        ),
        CheckConstraint("trim(child_name) <> ''", name="ck_user_profiles_child_name"),
        CheckConstraint(
            "allergy_status IN ('unknown','none_known','specified')",
            name="ck_user_profiles_allergy_status",
        ),
        CheckConstraint(
            "restriction_status IN ('none','specified')",
            name="ck_user_profiles_restriction_status",
        ),
        CheckConstraint(
            "safe_food_status IN ('none','listed')", name="ck_user_profiles_safe_food_status"
        ),
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    child_name: Mapped[str] = mapped_column(String, nullable=False)
    age_group: Mapped[str] = mapped_column(String, nullable=False)
    allergy_status: Mapped[str] = mapped_column(String, nullable=False)
    restriction_status: Mapped[str] = mapped_column(String, nullable=False)
    safe_food_status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
