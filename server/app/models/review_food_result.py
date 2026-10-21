"""Snapshot and outcome for one food in an after-meal review."""

from sqlalchemy import (
    JSON,
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Integer,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

JsonData = JSON().with_variant(JSONB, "postgresql")


class ReviewFoodResult(Base):
    __tablename__ = "review_food_results"
    __table_args__ = (
        CheckConstraint(
            "outcome IS NULL OR outcome IN ('eaten','tasted','untouched','unclear')",
            name="ck_review_food_results_outcome",
        ),
    )

    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meals.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True
    )
    food_snapshot: Mapped[dict] = mapped_column(JsonData, nullable=False)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulties: Mapped[list[dict]] = mapped_column(
        JsonData, nullable=False, default=list, server_default=text("'[]'")
    )
