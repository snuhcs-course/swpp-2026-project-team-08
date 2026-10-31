"""Authenticated meal write API."""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.meals.dto import (
    MealDetailResponse,
    MealFoodsWriteRequest,
    MealReviewResponse,
    MealReviewWriteRequest,
    MealWriteRequest,
    MealWriteResponse,
)

# AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
from app.features.meals.input_dto import (
    FoodData,
    FoodReviewData,
    IngredientData,
    IngredientReviewData,
    MealData,
    ReviewData,
    SuggestionLinkData,
)
from app.features.meals.serialization import (
    meal_detail_response,
    meal_response,
    meal_review_response,
)
from app.features.meals.service import (
    DuplicateIngredientError,
    IngredientNotFoundError,
    InvalidReviewError,
    InvalidSuggestionLinkError,
    MealAlreadyReviewedError,
    MealNotFoundError,
    MealService,
)

router = APIRouter(prefix="/meals", tags=["meals"], route_class=ErrorMappedRoute)


def get_meal_service(session: Annotated[AsyncSession, Depends(get_session)]) -> MealService:
    return MealService(session)


@router.put("", response_model=MealWriteResponse, summary="식사 저장")
@error_specs(
    {
        IngredientNotFoundError: ErrorSpec(status_code=404, error_code="INGREDIENT_NOT_FOUND"),
        DuplicateIngredientError: ErrorSpec(status_code=422, error_code="DUPLICATE_INGREDIENT"),
        InvalidSuggestionLinkError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_LINK"),
    }
)
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
    return meal_response(meal)


MealId = Annotated[int, Path(ge=1, le=2**63 - 1)]
MEAL_ERRORS = {MealNotFoundError: ErrorSpec(status_code=404, error_code="MEAL_NOT_FOUND")}


@router.get("", response_model=list[MealDetailResponse], summary="식사 기록 목록")
async def list_meals(
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> list[MealDetailResponse]:
    return [meal_detail_response(item) for item in await service.list_all(user_id=current_user.id)]


@router.get("/{meal_id}", response_model=MealDetailResponse, summary="식사 상세")
@error_specs(MEAL_ERRORS)
async def get_meal(
    meal_id: MealId,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealDetailResponse:
    return meal_detail_response(await service.get(user_id=current_user.id, meal_id=meal_id))


@router.put("/{meal_id}/foods", response_model=MealDetailResponse, summary="평가 전 식사 음식 수정")
@error_specs(
    {
        **MEAL_ERRORS,
        MealAlreadyReviewedError: ErrorSpec(status_code=409, error_code="MEAL_ALREADY_REVIEWED"),
        IngredientNotFoundError: ErrorSpec(status_code=404, error_code="INGREDIENT_NOT_FOUND"),
        DuplicateIngredientError: ErrorSpec(status_code=422, error_code="DUPLICATE_INGREDIENT"),
    }
)
async def update_meal_foods(
    meal_id: MealId,
    payload: MealFoodsWriteRequest,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealDetailResponse:
    foods = [
        FoodData(
            id=item.id,
            name=item.name,
            ingredients=[IngredientData(id=part.id, name=part.name) for part in item.ingredients],
            cooking_method=item.cooking_method.value if item.cooking_method else None,
            serving_note=item.serving_note,
            acceptance=item.acceptance,
        )
        for item in payload.foods
    ]
    return meal_detail_response(
        await service.update_foods(user_id=current_user.id, meal_id=meal_id, foods=foods)
    )


@router.put("/{meal_id}/review", response_model=MealReviewResponse, summary="식사 평가 저장")
@error_specs(
    {
        **MEAL_ERRORS,
        InvalidReviewError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_REVIEW"),
    }
)
async def write_review(
    meal_id: MealId,
    payload: MealReviewWriteRequest,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealReviewResponse:
    data = ReviewData(
        after_photo_uri=payload.after_photo_uri,
        food_results=[
            FoodReviewData(
                food_id=int(item.food_id),
                outcome=item.outcome,
                difficulties=[value.model_dump() for value in item.difficulties],
                ingredient_outcomes=[
                    IngredientReviewData(
                        ingredient_id=int(ingredient.ingredient_id),
                        outcome=ingredient.outcome,
                        difficulties=[value.model_dump() for value in ingredient.difficulties],
                    )
                    for ingredient in item.ingredient_outcomes
                ],
            )
            for item in payload.food_results
        ],
    )
    records = await service.review(user_id=current_user.id, meal_id=meal_id, data=data)
    return meal_review_response(records)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT, summary="식사 삭제")
@error_specs(MEAL_ERRORS)
async def delete_meal(
    meal_id: MealId,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> Response:
    await service.delete(user_id=current_user.id, meal_id=meal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
