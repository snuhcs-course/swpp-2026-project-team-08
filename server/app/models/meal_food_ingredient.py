"""Resolved shared ingredients attached to a meal food."""

from sqlalchemy import BigInteger, ForeignKey, ForeignKeyConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MealFoodIngredient(Base):
    __tablename__ = "meal_food_ingredients"
    __table_args__ = (
        ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )

    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("ingredients.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
