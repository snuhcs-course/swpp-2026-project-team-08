# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Store check-in ingredients independently of the catalog
"""Ingredients recorded during meal check-in, independent of the shared catalog."""

from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class MealIngredient(Base):
    __tablename__ = "meal_ingredients"
    __table_args__ = (
        CheckConstraint("id > 0", name="ck_meal_ingredients_id_positive"),
        CheckConstraint("trim(name) <> ''", name="ck_meal_ingredients_name"),
        UniqueConstraint("name", name="uq_meal_ingredients_name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    normalized_name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
