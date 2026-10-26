"""Ordered multi-select values in a child profile."""

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserProfileChoice(Base):
    __tablename__ = "user_profile_choices"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_user_profile_choices_position"),
        CheckConstraint(
            "(code IS NULL) <> (custom_name IS NULL)", name="ck_user_profile_choices_value"
        ),
        CheckConstraint(
            "category IN ('allergy','restriction','family_food',"
            "'difficult_texture','difficult_taste','presentation_preference')",
            name="ck_user_profile_choices_category",
        ),
        CheckConstraint("code IS NULL OR trim(code) <> ''", name="ck_user_profile_choices_code"),
        CheckConstraint(
            "custom_name IS NULL OR trim(custom_name) <> ''",
            name="ck_user_profile_choices_custom_name",
        ),
        UniqueConstraint("user_id", "category", "code", name="uq_user_profile_choices_code"),
        UniqueConstraint(
            "user_id", "category", "custom_name", name="uq_user_profile_choices_custom_name"
        ),
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("user_profiles.user_id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    category: Mapped[str] = mapped_column(String, primary_key=True)
    position: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str | None] = mapped_column(String, nullable=True)
    custom_name: Mapped[str | None] = mapped_column(String, nullable=True)
