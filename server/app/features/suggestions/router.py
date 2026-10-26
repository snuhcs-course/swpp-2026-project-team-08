# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가

"""Authenticated suggestion API in the documented v1 shape."""

from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.suggestions.dto import (
    SuggestionDecisionRequest,
    SuggestionGenerateRequest,
    SuggestionResponse,
)
from app.features.suggestions.service import (
    GenerationFailedError,
    InvalidSuggestionTargetError,
    ReviewRequiredError,
    SourceMealNotFoundError,
    SuggestionNotFoundError,
    Target,
    UserSuggestionService,
)
from app.models.user_suggestion import UserSuggestion

router = APIRouter(tags=["suggestions"], route_class=ErrorMappedRoute)
Id = Annotated[int, Path(ge=1, le=2**63 - 1)]
SOURCE_ERRORS = {
    SourceMealNotFoundError: ErrorSpec(status_code=404, error_code="MEAL_NOT_FOUND"),
}
SUGGESTION_ERRORS = {
    SuggestionNotFoundError: ErrorSpec(status_code=404, error_code="SUGGESTION_NOT_FOUND")
}


def get_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserSuggestionService:
    return UserSuggestionService(session)


Service = Annotated[UserSuggestionService, Depends(get_service)]


def response(item: UserSuggestion) -> SuggestionResponse:
    return SuggestionResponse(
        id=str(item.id),
        user_id=str(item.user_id),
        meal_id=str(item.meal_id),
        food_id=str(item.food_id),
        ingredient_id=str(item.ingredient_id) if item.ingredient_id is not None else None,
        food_snapshot=item.food_snapshot,
        what_to_try=item.what_to_try,
        why_this_may_help=item.why_this_may_help,
        serving_tip=item.serving_tip,
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
        response(item)
        for item in await service.list_saved(
            user_id=current_user.id, after_meal_date=after_meal_date
        )
    ]


@router.get("/meals/{meal_id}/suggestions", response_model=list[SuggestionResponse])
@error_specs(SOURCE_ERRORS)
async def list_for_meal(
    meal_id: Id,
    current_user: CurrentUser,
    service: Service,
    status_filter: Annotated[Literal["saved", "all"], Query(alias="status")] = "saved",
) -> list[SuggestionResponse]:
    return [
        response(item)
        for item in await service.list_for_meal(
            user_id=current_user.id, meal_id=meal_id, include_all=status_filter == "all"
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
        ReviewRequiredError: ErrorSpec(status_code=409, error_code="REVIEW_REQUIRED"),
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
    targets = [
        Target(
            food_id=int(item.food_id),
            ingredient_id=int(item.ingredient_id) if item.ingredient_id else None,
        )
        for item in payload.targets
    ]
    return [
        response(item)
        for item in await service.generate(
            user_id=current_user.id, meal_id=meal_id, targets=targets
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
