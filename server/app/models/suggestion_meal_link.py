"""Saved suggestion linked to a later authenticated meal."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Identity,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class SuggestionMealLink(Base):
    __tablename__ = "suggestion_meal_links"
    __table_args__ = (
        CheckConstraint("id > 0", name="ck_suggestion_meal_links_id_positive"),
        CheckConstraint(
            "feedback IS NULL OR feedback IN ('helpful','not_helpful','not_sure')",
            name="ck_suggestion_meal_links_feedback",
        ),
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
    suggestion_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("suggestions.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    food_id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"))
    ingredient_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("ingredients.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=True,
    )
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
