# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: meal_type, setting 을 StrEnum 으로 바꾸고 CHECK 제약 삭제

"""한 사용자가 기록한 식사."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Integer,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst
from app.models.meal_enums import MealSetting, MealType

if TYPE_CHECKING:
    from app.models.meal_food import MealFood


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    meal_date: Mapped[date] = mapped_column(Date, nullable=False)
    meal_type: Mapped[MealType] = mapped_column(
        Enum(MealType, native_enum=False, create_constraint=False, length=20), nullable=False
    )
    setting: Mapped[MealSetting] = mapped_column(
        Enum(MealSetting, native_enum=False, create_constraint=False, length=20), nullable=False
    )
    before_photo_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_photo_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    foods: Mapped[list["MealFood"]] = relationship(
        back_populates="meal", cascade="all, delete-orphan", lazy="selectin"
    )
