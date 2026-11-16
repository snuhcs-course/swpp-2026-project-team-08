# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 추천, 대문자 조회 필터, 프로필·시도 상태 오류 코드 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 기존 생성 API에서 선택적 추가 추천 처리

"""인증된 사용자의 음식 추천 API."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.core.errors import AppError
from app.features.auth.dependencies import CurrentUser
from app.features.suggestions.dto import (
    ListFilter,
    SuggestionDecisionRequest,
    SuggestionGenerateRequest,
    SuggestionResponse,
)
from app.features.suggestions.service import (
    FoodRecommendationService,
    GenerationFailedError,
    InvalidSuggestionTargetError,
    ProfileRequiredError,
    RecommendationRecord,
    RecommendationRetryUnavailableError,
    RecommendationTriedError,
    ReviewRequiredError,
    SourceMealNotFoundError,
    SuggestionNotFoundError,
)

router = APIRouter(tags=["suggestions"], route_class=ErrorMappedRoute)
Id = Annotated[int, Path(ge=1, le=2**63 - 1)]
SOURCE_ERRORS: dict[type[AppError], ErrorSpec] = {
    SourceMealNotFoundError: ErrorSpec(status_code=404, error_code="MEAL_NOT_FOUND"),
}
SUGGESTION_ERRORS: dict[type[AppError], ErrorSpec] = {
    SuggestionNotFoundError: ErrorSpec(status_code=404, error_code="SUGGESTION_NOT_FOUND"),
    RecommendationTriedError: ErrorSpec(status_code=409, error_code="RECOMMENDATION_ALREADY_TRIED"),
}


def get_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FoodRecommendationService:
    return FoodRecommendationService(session)


Service = Annotated[FoodRecommendationService, Depends(get_service)]


def response(record: RecommendationRecord) -> SuggestionResponse:
    item = record.item
    return SuggestionResponse(
        id=str(item.id),
        can_regenerate=record.can_regenerate,
        replacement_for_id=str(record.replacement_for_id) if record.replacement_for_id else None,
        user_id=str(item.user_id),
        origin_food_id=str(item.origin_food_id),
        meal_id=str(record.meal_id),
        what_to_try=item.what_to_try,
        why_this_may_help=item.why_this_may_help,
        serving_tip=item.serving_tip,
        ingredients=item.ingredients,
        cooking_method=item.cooking_method,
        causes=item.causes,
        status=item.status,
        dismiss_reasons=item.dismiss_reasons,
        saved_at=item.saved_at,
        created_at=item.created_at,
    )


@router.get("/suggestions", response_model=list[SuggestionResponse])
async def list_saved(
    current_user: CurrentUser,
    service: Service,
    after_meal_date: date | None = None,
) -> list[SuggestionResponse]:
    return [
        response(record)
        for record in await service.list_saved(
            user_id=current_user.id, after_meal_date=after_meal_date
        )
    ]


@router.get("/meals/{meal_id}/suggestions", response_model=list[SuggestionResponse])
@error_specs(SOURCE_ERRORS)
async def list_for_meal(
    meal_id: Id,
    current_user: CurrentUser,
    service: Service,
    status_filter: Annotated[ListFilter, Query(alias="status")] = "SAVED",
) -> list[SuggestionResponse]:
    return [
        response(record)
        for record in await service.list_for_meal(
            user_id=current_user.id, meal_id=meal_id, include_all=status_filter == "ALL"
        )
    ]


@router.post(
    "/meals/{meal_id}/suggestions",
    status_code=status.HTTP_201_CREATED,
    response_model=list[SuggestionResponse],
)
@error_specs(
    {
        **SOURCE_ERRORS,
        RecommendationRetryUnavailableError: ErrorSpec(
            status_code=409, error_code="RECOMMENDATION_RETRY_UNAVAILABLE"
        ),
        ReviewRequiredError: ErrorSpec(status_code=409, error_code="REVIEW_REQUIRED"),
        ProfileRequiredError: ErrorSpec(status_code=409, error_code="PROFILE_REQUIRED"),
        InvalidSuggestionTargetError: ErrorSpec(
            status_code=422, error_code="INVALID_SUGGESTION_TARGET"
        ),
        GenerationFailedError: ErrorSpec(status_code=502, error_code="GENERATION_FAILED"),
    }
)
async def generate(
    meal_id: Id,
    payload: SuggestionGenerateRequest,
    current_user: CurrentUser,
    service: Service,
) -> list[SuggestionResponse]:
    food_ids = [int(item.food_id) for item in payload.targets]
    rejected_suggestions = {
        int(item.food_id): int(item.rejected_suggestion_id)
        for item in payload.targets
        if item.rejected_suggestion_id is not None
    }
    return [
        response(record)
        for record in await service.generate(
            user_id=current_user.id,
            meal_id=meal_id,
            food_ids=food_ids,
            rejected_suggestions=rejected_suggestions,
        )
    ]


@router.put("/suggestions/{suggestion_id}/decision", response_model=SuggestionResponse)
@error_specs(SUGGESTION_ERRORS)
async def decide(
    suggestion_id: Id,
    payload: SuggestionDecisionRequest,
    current_user: CurrentUser,
    service: Service,
) -> SuggestionResponse:
    return response(
        await service.decide(
            user_id=current_user.id,
            suggestion_id=suggestion_id,
            status=payload.status,
            dismiss_reasons=payload.dismiss_reasons,
        )
    )


@router.delete("/suggestions/{suggestion_id}/decision", response_model=SuggestionResponse)
@error_specs(SUGGESTION_ERRORS)
async def undo(
    suggestion_id: Id,
    current_user: CurrentUser,
    service: Service,
) -> SuggestionResponse:
    return response(await service.undo(user_id=current_user.id, suggestion_id=suggestion_id))
