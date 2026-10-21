"""Authenticated meals owned by one user."""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.food_item import FoodItem


class Meal(Base):
    __tablename__ = "meals"
    __table_args__ = (
        CheckConstraint("id > 0", name="ck_meals_id_positive"),
        CheckConstraint(
            "meal_type IN ('breakfast','lunch','dinner','snack')", name="ck_meals_meal_type"
        ),
        CheckConstraint(
            "setting IN ('home','restaurant','school','others')", name="ck_meals_setting"
        ),
    )

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
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    setting: Mapped[str] = mapped_column(String(20), nullable=False)
    before_photo_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_photo_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    foods: Mapped[list["FoodItem"]] = relationship(
        back_populates="meal", cascade="all, delete-orphan", lazy="selectin"
    )
