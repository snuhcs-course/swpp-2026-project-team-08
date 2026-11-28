# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 추천, 대문자 조회 필터, 프로필·시도 상태 오류 코드 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 기존 생성 API에서 선택적 추가 추천 처리
# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 시도 기록과 독립된 저장 목록 제거 API
# AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
# Changed: 식사 기준 생성·조회 API를 홈 화면 추천 한 장 생성 API로 대체

"""인증된 사용자의 음식 추천 API."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.core.errors import AppError
from app.features.auth.dependencies import CurrentUser
from app.features.suggestions.dto import SuggestionDecisionRequest, SuggestionResponse
from app.features.suggestions.service import (
    FoodRecommendationService,
    GenerationFailedError,
    ProfileRequiredError,
    RecommendationTriedError,
    SuggestionNotFoundError,
)
from app.models import FoodRecommendation

router = APIRouter(tags=["suggestions"], route_class=ErrorMappedRoute)
Id = Annotated[int, Path(ge=1, le=2**63 - 1)]
SUGGESTION_ERRORS: dict[type[AppError], ErrorSpec] = {
    SuggestionNotFoundError: ErrorSpec(status_code=404, error_code="SUGGESTION_NOT_FOUND"),
    RecommendationTriedError: ErrorSpec(status_code=409, error_code="RECOMMENDATION_ALREADY_TRIED"),
}


def get_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FoodRecommendationService:
    return FoodRecommendationService(session)


Service = Annotated[FoodRecommendationService, Depends(get_service)]


def response(item: FoodRecommendation) -> SuggestionResponse:
    return SuggestionResponse(
        id=str(item.id),
        user_id=str(item.user_id),
        what_to_try=item.what_to_try,
        why_this_may_help=item.why_this_may_help,
        ingredients=item.ingredients,
        preparation_method=item.serving_tip,
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


@router.post(
    "/suggestions",
    status_code=status.HTTP_201_CREATED,
    response_model=SuggestionResponse,
)
@error_specs(
    {
        ProfileRequiredError: ErrorSpec(status_code=409, error_code="PROFILE_REQUIRED"),
        GenerationFailedError: ErrorSpec(status_code=502, error_code="GENERATION_FAILED"),
    }
)
async def generate(current_user: CurrentUser, service: Service) -> SuggestionResponse:
    return response(await service.generate(user_id=current_user.id))


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


@router.delete("/suggestions/{suggestion_id}/saved", status_code=status.HTTP_204_NO_CONTENT)
@error_specs({SuggestionNotFoundError: SUGGESTION_ERRORS[SuggestionNotFoundError]})
async def remove_saved(
    suggestion_id: Id,
    current_user: CurrentUser,
    service: Service,
) -> Response:
    await service.remove_saved(user_id=current_user.id, suggestion_id=suggestion_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
