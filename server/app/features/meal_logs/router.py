# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""식사 기록 HTTP 라우터: /children/{child_id}/meals."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.meal_logs.dto import (
    CalendarDayResponse,
    DuplicateFoodIdError,
    EmptyFoodsError,
    InvalidMealSettingError,
    InvalidMealTypeError,
    MealDetailResponse,
    MealFoodResponse,
    MealFoodSummaryResponse,
    MealListItemResponse,
    MealReviewRequest,
    MealReviewResponse,
    MealSuggestionRequest,
    MealSuggestionResponse,
    MealUpsertRequest,
)
from app.features.meal_logs.link_data import (
    InvalidMealLinkError,
    SuggestionFeedbackData,
    SuggestionLinkData,
)
from app.features.meal_logs.service import InvalidMonthError, MealLogService, MealNotFoundError
from app.models import MealLog

router = APIRouter(
    prefix="/children/{child_id}/meals",
    tags=["meal-logs"],
    route_class=ErrorMappedRoute,
)


def get_meal_log_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MealLogService:
    return MealLogService(session)


MEAL_WRITE_ERRORS = {
    InvalidMealLinkError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_LINK"),
    InvalidMealTypeError: ErrorSpec(
        status_code=422,
        error_code="INVALID_MEAL_TYPE",
        details=lambda e: {"meal_type": e.meal_type},
    ),
    InvalidMealSettingError: ErrorSpec(
        status_code=422,
        error_code="INVALID_MEAL_SETTING",
        details=lambda e: {"setting": e.setting},
    ),
    EmptyFoodsError: ErrorSpec(status_code=422, error_code="EMPTY_FOODS"),
    DuplicateFoodIdError: ErrorSpec(
        status_code=422,
        error_code="DUPLICATE_FOOD_ID",
        details=lambda e: {"food_id": e.food_id},
    ),
    MealNotFoundError: ErrorSpec(
        status_code=404,
        error_code="MEAL_NOT_FOUND",
        details=lambda e: {"meal_id": e.meal_id},
    ),
}

MEAL_LOOKUP_ERRORS = {
    InvalidMealLinkError: ErrorSpec(status_code=422, error_code="INVALID_MEAL_LINK"),
    MealNotFoundError: ErrorSpec(
        status_code=404,
        error_code="MEAL_NOT_FOUND",
        details=lambda e: {"meal_id": e.meal_id},
    ),
}

CALENDAR_ERRORS = {
    InvalidMonthError: ErrorSpec(
        status_code=422,
        error_code="INVALID_MONTH",
        details=lambda e: {"month": e.month},
    ),
}


def _detail(meal: MealLog) -> MealDetailResponse:
    return MealDetailResponse(
        id=meal.id,
        child_id=meal.child_id,
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        setting=meal.setting,
        before_photo_uri=meal.before_photo_uri,
        suggestion_links=meal.suggestion_links,
        saved_at=meal.saved_at,
        foods=[MealFoodResponse.model_validate(food) for food in meal.foods],
        review=MealReviewResponse.model_validate(meal.review) if meal.review else None,
        suggestions=[MealSuggestionResponse.model_validate(item) for item in meal.suggestions],
    )


def _list_item(meal: MealLog) -> MealListItemResponse:
    return MealListItemResponse(
        id=meal.id,
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        setting=meal.setting,
        before_photo_uri=meal.before_photo_uri,
        foods=[
            MealFoodSummaryResponse(name=food.name, ingredients=list(food.ingredients))
            for food in meal.foods
        ],
        review_status="reviewed" if meal.review is not None else "awaiting_review",
    )


@router.put("/{meal_id}", response_model=MealDetailResponse, summary="식사 기록 저장")
@error_specs(MEAL_WRITE_ERRORS)
async def upsert_meal(
    child_id: str,
    meal_id: str,
    payload: MealUpsertRequest,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> MealDetailResponse:
    meal = await service.upsert_meal(
        child_id=child_id,
        meal_id=meal_id,
        meal_date=payload.meal_date,
        meal_type=payload.meal_type,
        setting=payload.setting,
        before_photo_uri=payload.before_photo_uri,
        foods=[food.model_dump() for food in payload.foods],
        suggestion_links=[
            SuggestionLinkData(**link.model_dump()) for link in payload.suggestion_links
        ],
        saved_at=payload.saved_at,
    )
    return _detail(meal)


@router.get("", response_model=list[MealListItemResponse], summary="식사 기록 목록")
async def list_meals(
    child_id: str,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
    on_date: Annotated[date | None, Query(alias="date")] = None,
) -> list[MealListItemResponse]:
    meals = await service.list_for_child(child_id=child_id, meal_date=on_date)
    return [_list_item(meal) for meal in meals]


@router.get("/calendar", response_model=list[CalendarDayResponse], summary="월별 기록 수")
@error_specs(CALENDAR_ERRORS)
async def meal_calendar(
    child_id: str,
    month: str,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> list[CalendarDayResponse]:
    rows = await service.calendar(child_id=child_id, month=month)
    return [CalendarDayResponse(date=day, count=count) for day, count in rows]


@router.get("/{meal_id}", response_model=MealDetailResponse, summary="식사 기록 상세")
@error_specs(MEAL_LOOKUP_ERRORS)
async def get_meal(
    child_id: str,
    meal_id: str,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> MealDetailResponse:
    meal = await service.get_owned(child_id, meal_id)
    detail = _detail(meal)
    snapshots = await service.linked_suggestions(meal)
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    detail.suggestions = [
        MealSuggestionResponse.model_validate(snapshot) for snapshot in snapshots
    ] + detail.suggestions
    return detail


@router.put("/{meal_id}/review", response_model=MealDetailResponse, summary="식후 리뷰 저장")
@error_specs(MEAL_LOOKUP_ERRORS)
async def save_review(
    child_id: str,
    meal_id: str,
    payload: MealReviewRequest,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> MealDetailResponse:
    meal = await service.save_review(
        child_id=child_id,
        meal_id=meal_id,
        after_photo_uri=payload.after_photo_uri,
        outcomes=[outcome.model_dump() for outcome in payload.outcomes],
        difficulties=payload.difficulties,
        # AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
        suggestion_feedback={
            key: SuggestionFeedbackData(tried=value.tried)
            for key, value in payload.suggestion_feedback.items()
        },
        saved_at=payload.saved_at,
    )
    return _detail(meal)


@router.post(
    "/{meal_id}/suggestions",
    response_model=MealSuggestionResponse,
    summary="연결된 제안 저장",
)
@error_specs(MEAL_LOOKUP_ERRORS)
async def save_suggestion(
    child_id: str,
    meal_id: str,
    payload: MealSuggestionRequest,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> MealSuggestionResponse:
    suggestion = await service.save_suggestion(
        child_id=child_id,
        meal_id=meal_id,
        suggestion_id=payload.id,
        food_id=payload.food_id,
        title=payload.title,
        description=payload.description,
        serving_tip=payload.serving_tip,
        ingredients=payload.ingredients,
    )
    return MealSuggestionResponse.model_validate(suggestion)


@router.delete(
    "/{meal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="식사 기록 삭제",
)
@error_specs(MEAL_LOOKUP_ERRORS)
async def delete_meal(
    child_id: str,
    meal_id: str,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> Response:
    await service.delete(child_id=child_id, meal_id=meal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
