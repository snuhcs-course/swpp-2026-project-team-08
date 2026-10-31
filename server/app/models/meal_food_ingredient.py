# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Reference check-in ingredients independently of the catalog
# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 사용자 입력 재료를 음식별 행으로 저장하고 식후 리뷰 결과 통합

"""사용자가 식사 안의 음식에 들어갔다고 기록한 재료.

입력한 이름을 그대로 저장하는 기록이다. 추천용 재료 카탈로그(`ingredients`)를 참조하지 않으며,
같은 이름도 음식마다 별도 행이다. 식후 리뷰 결과도 이 테이블이 갖고 `outcome` 이 NULL 이면 미리뷰다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Identity, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.meal_enums import EatingOutcome


class MealFoodIngredient(Base):
    __tablename__ = "meal_food_ingredients"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    meal_food_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meal_foods.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 사용자가 입력한 이름 그대로. 중복 제거나 유니크 제약이 없다.
    name: Mapped[str] = mapped_column(String, nullable=False)
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
