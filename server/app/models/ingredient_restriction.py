# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 재료의 제한 판정 테이블 추가

"""재료가 아이의 제한에 걸리는지에 대한 판정.

판정이 끝난 쌍은 NEVER 를 포함해 모두 저장한다. 행이 없으면 아직 판정하지 않은 것이며,
판정이 없는 쌍은 그 제한을 가진 아이의 추천 후보에서 제외한다.
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Index,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType


class IngredientRestriction(Base):
    __tablename__ = "ingredient_restrictions"
    __table_args__ = (
        UniqueConstraint(
            "ingredient_id", "restriction_type", name="uq_ingredient_restrictions_pair"
        ),
        Index("ix_ingredient_restrictions_type_degree", "restriction_type", "degree"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("ingredients.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    # ALLERGY.NONE 은 재료의 판정에 쓰지 않는다. 서비스가 거절한다.
    # 멤버 이름(ALLERGY_EGGS)이 아니라 경로 값(ALLERGY.EGGS)을 저장하도록 values_callable 을 쓴다.
    restriction_type: Mapped[RestrictionType] = mapped_column(
        Enum(
            RestrictionType,
            native_enum=False,
            create_constraint=False,
            length=40,
            values_callable=lambda members: [member.value for member in members],
        ),
        nullable=False,
    )
    degree: Mapped[RestrictionDegree] = mapped_column(
        Enum(RestrictionDegree, native_enum=False, create_constraint=False, length=20),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
