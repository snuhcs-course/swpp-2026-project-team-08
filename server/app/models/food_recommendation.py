# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: UserSuggestion 을 FoodRecommendation 으로 바꾸고 음식 단위 추천 구조로 재편
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 시도 상태와 별개로 저장 목록 제거 시각 관리
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 홈 화면 추천을 위해 origin_food_id 를 nullable 로 바꾸고 제거 예정 컬럼 표시

"""보호자가 홈 화면에서 요청해 만든 음식 추천.

추천은 특정 식사나 음식에 묶이지 않는다. 식후 음식별로 만들던 이전 추천만 `origin_food_id` 로
근거가 된 음식을 가리키며, 그 음식이 삭제되면 추천과 시도 기록도 함께 삭제된다.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Identity, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, StringList
from app.core.timezone import now_kst
from app.models.food_recommendation_enums import FoodRecommendationStatus
from app.models.meal_enums import MealCookingMethod


class FoodRecommendation(Base):
    __tablename__ = "food_recommendations"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), Identity(), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 제거 예정. 이전 식후 음식별 추천의 근거 음식이며, 홈 화면 추천은 NULL 이다.
    origin_food_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("meal_foods.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    what_to_try: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_may_help: Mapped[str] = mapped_column(Text, nullable=False)
    # 편식을 덜기 위해 이 음식을 제공할 때 고려할 사항. API 에서는 `preparation_method` 이다.
    serving_tip: Mapped[str | None] = mapped_column(Text, nullable=True)
    # LLM 이 반환한 재료 이름 목록을 그대로 저장한다. 재료 카탈로그를 참조하지 않는다.
    ingredients: Mapped[list[str]] = mapped_column(StringList, nullable=False)
    # 제거 예정. 이전 추천의 조리법이며, 홈 화면 추천은 OTHER 로 채운다.
    cooking_method: Mapped[MealCookingMethod] = mapped_column(
        Enum(MealCookingMethod, native_enum=False, create_constraint=False, length=30),
        nullable=False,
    )
    # 제거 예정. 이전 추천이 참고한 식후 리뷰 특성이며, 홈 화면 추천은 빈 문자열로 채운다.
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
