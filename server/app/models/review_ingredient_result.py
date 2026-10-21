"""Outcome for an ingredient within a reviewed food snapshot."""

from sqlalchemy import JSON, BigInteger, CheckConstraint, ForeignKeyConstraint, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

JsonData = JSON().with_variant(JSONB, "postgresql")


class ReviewIngredientResult(Base):
    __tablename__ = "review_ingredient_results"
    __table_args__ = (
        ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["review_food_results.meal_id", "review_food_results.food_id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            "outcome IS NULL OR outcome IN ('eaten','tasted','untouched','unclear')",
            name="ck_review_ingredient_results_outcome",
        ),
    )

    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulties: Mapped[list[dict]] = mapped_column(
        JsonData, nullable=False, default=list, server_default=text("'[]'")
    )
