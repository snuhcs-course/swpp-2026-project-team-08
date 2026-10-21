"""Saved suggestion linked to a later authenticated meal."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Identity,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SuggestionMealLink(Base):
    __tablename__ = "suggestion_meal_links"
    __table_args__ = (
        ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["meal_id", "food_id", "ingredient_id"],
            [
                "meal_food_ingredients.meal_id",
                "meal_food_ingredients.food_id",
                "meal_food_ingredients.ingredient_id",
            ],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        UniqueConstraint("meal_id", "suggestion_id"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=False
    )
    suggestion_id: Mapped[str] = mapped_column(
        String(80), ForeignKey("suggestions.id", onupdate="CASCADE", ondelete="CASCADE")
    )
    food_id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"))
    ingredient_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("ingredients.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=True,
    )
    feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
