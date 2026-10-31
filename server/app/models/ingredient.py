# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 이름 컬럼을 korean_name, english_name 으로 나누고 id 를 자동 증가로 변경

"""추천용 공용 재료 카탈로그.

음식 추천 때 아이의 제한을 지킨 재료 목록을 LLM 에게 주기 위해 존재한다. 사용자가 식사에 기록한
재료(`meal_food_ingredients`)와는 서로 참조하지 않는 별개 테이블이다.
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Identity,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class Ingredient(Base):
    __tablename__ = "ingredients"
    # 두 이름 중 하나는 반드시 있어야 한다. 컬럼의 NULL 여부를 정하는 구조 제약이라 CHECK 로 둔다.
    __table_args__ = (
        CheckConstraint(
            "korean_name IS NOT NULL OR english_name IS NOT NULL",
            name="ck_ingredients_name_present",
        ),
        UniqueConstraint("korean_name", name="uq_ingredients_korean_name"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    korean_name: Mapped[str | None] = mapped_column(String, nullable=True)
    # 영어 이름은 겹치는 재료가 있어 유니크로 두지 않는다.
    english_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
