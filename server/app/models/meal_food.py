# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: FoodItem 을 MealFood 로 바꾸고 식후 리뷰 결과(outcome, difficulty_reasons) 통합

"""식사 안의 음식 하나.

식후 리뷰 결과도 이 테이블이 갖는다. `outcome` 이 NULL 이면 아직 리뷰하지 않은 음식이다.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Integer,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.meal_enums import EatingOutcome, MealCookingMethod

if TYPE_CHECKING:
    from app.models.meal import Meal


class MealFood(Base):
    __tablename__ = "meal_foods"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    meal_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meals.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    cooking_method: Mapped[MealCookingMethod | None] = mapped_column(
        Enum(MealCookingMethod, native_enum=False, create_constraint=False, length=30),
        nullable=True,
    )
    serving_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    acceptance: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    # 식후 리뷰 결과. NULL 이면 미리뷰다.
    outcome: Mapped[EatingOutcome | None] = mapped_column(
        Enum(EatingOutcome, native_enum=False, create_constraint=False, length=20),
        nullable=True,
    )
    # 원소는 DifficultyReason 값이다. 검증은 DTO 와 서비스가 맡는다.
    difficulty_reasons: Mapped[list[str]] = mapped_column(
        StringList, nullable=False, default=list, server_default=text("'[]'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )

    meal: Mapped["Meal"] = relationship(back_populates="foods")
