"""Authenticated meal write API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.meals.data import FoodData, IngredientData, MealData, SuggestionLinkData
from app.features.meals.dto import MealWriteRequest, MealWriteResponse
from app.features.meals.service import (
    DuplicateIngredientError,
    IngredientNotFoundError,
    InvalidSuggestionLinkError,
    MealService,
)

router = APIRouter(prefix="/meals", tags=["meals"], route_class=ErrorMappedRoute)


def get_meal_service(session: Annotated[AsyncSession, Depends(get_session)]) -> MealService:
    return MealService(session)


@router.put("", response_model=MealWriteResponse, summary="식사 저장")
@error_specs({
    IngredientNotFoundError: ErrorSpec(status_code=404, error_code="INGREDIENT_NOT_FOUND"),
    DuplicateIngredientError: ErrorSpec(status_code=422, error_code="DUPLICATE_INGREDIENT"),
    InvalidSuggestionLinkError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_LINK"),
})
async def write_meal(
    payload: MealWriteRequest,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealWriteResponse:
    data = MealData(
        meal_date=payload.meal_date,
        meal_type=payload.meal_type,
        setting=payload.setting,
        before_photo_uri=payload.before_photo_uri,
        foods=[
            FoodData(
                id=food.id,
                name=food.name,
                ingredients=[
                    IngredientData(id=item.id, name=item.name) for item in food.ingredients
                ],
                cooking_method=food.cooking_method.value if food.cooking_method else None,
                serving_note=food.serving_note,
                acceptance=food.acceptance,
            )
            for food in payload.foods
        ],
        suggestion_links=[
            SuggestionLinkData(
                suggestion_id=link.suggestion_id,
                food_id=link.food_id,
                ingredient_id=link.ingredient_id,
            )
            for link in payload.suggestion_links
        ],
    )
    meal = await service.write(user_id=current_user.id, data=data)
    return MealWriteResponse(
        id=str(meal.id),
        user_id=str(current_user.id),
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        setting=meal.setting,
        before_photo_uri=meal.before_photo_uri,
        after_photo_uri=meal.after_photo_uri,
        saved_at=meal.saved_at,
    )
