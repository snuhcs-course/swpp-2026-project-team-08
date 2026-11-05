# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 저장·수정·리뷰가 상세 응답을 돌려주도록 변경, 카탈로그 오류 제거

# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: 최신 식사 동작 유지 및 입력·응답 모듈 경로 정리

"""인증된 사용자의 식사 저장·조회·수정·리뷰 API."""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.core.errors import AppError
from app.features.auth.dependencies import CurrentUser
from app.features.meals.dto import (
    FoodWriteRequest,
    MealDetailResponse,
    MealFoodCreateRequest,
    MealFoodsWriteRequest,
    MealFoodUpdateRequest,
    MealReviewWriteRequest,
    MealWriteRequest,
)
from app.features.meals.input_dto import (
    FoodData,
    FoodReviewData,
    IngredientData,
    IngredientReviewData,
    MealData,
    ReviewData,
)
from app.features.meals.serialization import meal_detail_response
from app.features.meals.service import (
    DuplicateIngredientError,
    InvalidFoodError,
    InvalidRecommendationLinkError,
    InvalidReviewError,
    MealAlreadyReviewedError,
    MealNotFoundError,
    MealService,
)

router = APIRouter(prefix="/meals", tags=["meals"], route_class=ErrorMappedRoute)


def get_meal_service(session: Annotated[AsyncSession, Depends(get_session)]) -> MealService:
    return MealService(session)


def _food_data(
    food: FoodWriteRequest, *, food_id: str | None, recommendation_ids: list[str]
) -> FoodData:
    return FoodData(
        id=int(food_id) if food_id is not None else None,
        name=food.name,
        ingredients=[IngredientData(name=item.name) for item in food.ingredients],
        cooking_method=food.cooking_method,
        serving_note=food.serving_note,
        acceptance=food.acceptance,
        food_recommendation_ids=[int(item) for item in recommendation_ids],
    )


def _created_food(food: MealFoodCreateRequest) -> FoodData:
    return _food_data(food, food_id=None, recommendation_ids=food.food_recommendation_ids)


def _updated_food(food: MealFoodUpdateRequest) -> FoodData:
    return _food_data(food, food_id=food.id, recommendation_ids=[])


MealId = Annotated[int, Path(ge=1, le=2**63 - 1)]
MEAL_ERRORS: dict[type[AppError], ErrorSpec] = {
    MealNotFoundError: ErrorSpec(status_code=404, error_code="MEAL_NOT_FOUND")
}


@router.put("", response_model=MealDetailResponse, summary="식사 저장")
@error_specs(
    {
        DuplicateIngredientError: ErrorSpec(status_code=422, error_code="DUPLICATE_INGREDIENT"),
        InvalidRecommendationLinkError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_LINK"),
    }
)
async def write_meal(
    payload: MealWriteRequest,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealDetailResponse:
    data = MealData(
        meal_date=payload.meal_date,
        meal_type=payload.meal_type,
        setting=payload.setting,
        before_photo_uri=payload.before_photo_uri,
        foods=[_created_food(food) for food in payload.foods],
    )
    return meal_detail_response(await service.write(user_id=current_user.id, data=data))


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
        DuplicateIngredientError: ErrorSpec(status_code=422, error_code="DUPLICATE_INGREDIENT"),
        InvalidFoodError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_FOOD"),
    }
)
async def update_meal_foods(
    meal_id: MealId,
    payload: MealFoodsWriteRequest,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> MealDetailResponse:
    foods = [_updated_food(item) for item in payload.foods]
    return meal_detail_response(
        await service.update_foods(user_id=current_user.id, meal_id=meal_id, foods=foods)
    )


@router.put("/{meal_id}/review", response_model=MealDetailResponse, summary="식사 평가 저장")
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
) -> MealDetailResponse:
    data = ReviewData(
        after_photo_uri=payload.after_photo_uri,
        food_results=[
            FoodReviewData(
                food_id=int(item.food_id),
                outcome=item.outcome,
                difficulty_reasons=[reason.value for reason in item.difficulty_reasons],
                ingredient_outcomes=[
                    IngredientReviewData(
                        ingredient_id=int(ingredient.ingredient_id),
                        outcome=ingredient.outcome,
                        difficulty_reasons=[
                            reason.value for reason in ingredient.difficulty_reasons
                        ],
                    )
                    for ingredient in item.ingredient_outcomes
                ],
            )
            for item in payload.food_results
        ],
    )
    return meal_detail_response(
        await service.review(user_id=current_user.id, meal_id=meal_id, data=data)
    )


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT, summary="식사 삭제")
@error_specs(MEAL_ERRORS)
async def delete_meal(
    meal_id: MealId,
    current_user: CurrentUser,
    service: Annotated[MealService, Depends(get_meal_service)],
) -> Response:
    await service.delete(user_id=current_user.id, meal_id=meal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
