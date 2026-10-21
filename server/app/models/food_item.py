"""Food saved within an authenticated meal."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.timezone import now_kst

if TYPE_CHECKING:
    from app.models.meal import Meal


class FoodItem(Base):
    __tablename__ = "meal_foods"

    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meals.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    cooking_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    serving_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    acceptance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    meal: Mapped["Meal"] = relationship(back_populates="foods")
