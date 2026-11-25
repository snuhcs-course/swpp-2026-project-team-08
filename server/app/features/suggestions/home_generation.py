# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 홈 추천 결과 형식과 감자·당근 예시 카드 정의

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal_enums import MealCookingMethod, MealCookingMethodInput

NonBlankText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class HomeSuggestionResult(BaseModel):
    """홈에 표시할 추천 한 장."""

    model_config = ConfigDict(extra="forbid", revalidate_instances="always")

    food_name: NonBlankText
    what_to_try: NonBlankText
    why_this_may_help: NonBlankText
    ingredients: list[NonBlankText] = Field(min_length=1)
    serving_tip: NonBlankText
    cooking_method: MealCookingMethodInput
    causes: NonBlankText


async def generate_home_suggestion(session: AsyncSession, *, user_id: int) -> HomeSuggestionResult:
    """홈 추천 흐름에서 사용하는 디자인 예시 카드."""
    return HomeSuggestionResult(
        food_name="Mashed potato with carrot",
        what_to_try="Offer mashed potato with carrot",
        why_this_may_help="Carrot adds a new flavor while the mash keeps a consistent texture.",
        ingredients=["Potato", "Carrot"],
        serving_tip=(
            "Cook the potato and carrot until soft. "
            "Mash to the same texture and serve a small portion separately."
        ),
        cooking_method=MealCookingMethod.MASHED,
        causes="A change in flavor with a consistent texture.",
    )
