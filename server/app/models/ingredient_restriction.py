# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""확정된 재료·제한 쌍만 저장한다. 행이 없으면 미확인이다.

relation은 모든 제한에서 '제한에 걸리는가'를 뜻한다. 식단 이름이 gluten-free나
ketogenic이어도 ALWAYS는 적합하다는 뜻이 아니다. NEVER만 해당 검사를 통과한다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class IngredientRestriction(Base):
    __tablename__ = "ingredient_restrictions"
    __table_args__ = (
        CheckConstraint(
            "relation IN ('ALWAYS','NEVER','DEPENDS_ON_PRODUCT')",
            name="ck_ingredient_restrictions_relation",
        ),
    )
    ingredient_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("ingredients.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    restriction_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("restrictions.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    relation: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
