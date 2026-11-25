# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: UserSuggestion 을 FoodRecommendation 으로 바꾸고 음식 단위 추천 구조로 재편
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 시도 상태와 별개로 저장 목록 제거 시각 관리
# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 추천 음식명 필수 저장, 원본 음식 없는 추천 허용, 재생성 요청 ID 저장

"""음식명과 다음 식사에서 시도할 방법을 담은 추천.

`origin_food_id` 가 가리키는 음식이 삭제되면 추천과 시도 기록도 함께 삭제된다.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Index,
    Integer,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.food_recommendation_enums import FoodRecommendationStatus
from app.models.meal_enums import MealCookingMethod


class FoodRecommendation(Base):
    __tablename__ = "food_recommendations"
    __table_args__ = (
        Index(
            "uq_recommendation_regeneration_request",
            "user_id",
            "regeneration_request_id",
            unique=True,
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 추천의 근거가 된 음식
    origin_food_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meal_foods.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    food_name: Mapped[str] = mapped_column(Text, nullable=False)
    regeneration_request_id: Mapped[UUID | None] = mapped_column(Uuid())
    what_to_try: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_may_help: Mapped[str] = mapped_column(Text, nullable=False)
    serving_tip: Mapped[str | None] = mapped_column(Text, nullable=True)
    # LLM 이 반환한 재료 이름 목록을 그대로 저장한다. 재료 카탈로그를 참조하지 않는다.
    ingredients: Mapped[list[str]] = mapped_column(StringList, nullable=False)
    cooking_method: Mapped[MealCookingMethod] = mapped_column(
        Enum(MealCookingMethod, native_enum=False, create_constraint=False, length=30),
        nullable=False,
    )
    # 식후 리뷰에서 참고한 특성(아이가 어려워한 원인)을 LLM 이 서술한 문장
    causes: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[FoodRecommendationStatus] = mapped_column(
        Enum(FoodRecommendationStatus, native_enum=False, create_constraint=False, length=20),
        nullable=False,
        default=FoodRecommendationStatus.PENDING,
    )
    # 원소는 FoodRecommendationDismissReason 값이다. 검증은 DTO 와 서비스가 맡는다.
    dismiss_reasons: Mapped[list[str]] = mapped_column(
        StringList, nullable=False, default=list, server_default=text("'[]'")
    )
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    removed_from_saved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst, nullable=False
    )
