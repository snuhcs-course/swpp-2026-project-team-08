# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 홈 추천 생성기의 호출과 결과 형식 정의

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.meal_enums import MealCookingMethodInput

NonBlankText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class HomeSuggestionResult(BaseModel):
    """생성기가 안전성 검사를 마치고 서비스에 전달하는 추천 한 장."""

    model_config = ConfigDict(extra="forbid", revalidate_instances="always")

    food_name: NonBlankText
    what_to_try: NonBlankText
    why_this_may_help: NonBlankText
    ingredients: list[NonBlankText] = Field(min_length=1)
    serving_tip: NonBlankText
    cooking_method: MealCookingMethodInput
    causes: NonBlankText


class HomeSuggestionGeneratorUnavailableError(AppError):
    pass


async def generate_home_suggestion(session: AsyncSession, *, user_id: int) -> HomeSuggestionResult:
    """보호자의 기록을 읽어 홈 추천 한 장을 생성할 워크플로 연결점."""
    raise HomeSuggestionGeneratorUnavailableError()
