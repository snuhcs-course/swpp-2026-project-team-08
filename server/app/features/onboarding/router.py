# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 요청·응답을 restrictions 목록 기반으로 변환하고 SAFE_FOOD_NOT_FOUND 제거
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형을 요청·응답에 반영

"""로그인한 사용자의 온보딩 API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.onboarding.dto import (
    OnboardingResponse,
    OnboardingWriteRequest,
    SafeFoodDto,
    UserConsentDto,
    UserProfileDto,
)
from app.features.onboarding.service import (
    ConsentInput,
    OnboardingInput,
    OnboardingService,
    OnboardingSnapshot,
    SafeFoodInput,
)
from app.models.restriction_enums import RestrictionType

router = APIRouter(prefix="/onboarding", tags=["onboarding"], route_class=ErrorMappedRoute)


def get_onboarding_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OnboardingService:
    return OnboardingService(session)


def _input(payload: OnboardingWriteRequest) -> OnboardingInput:
    profile = payload.profile
    return OnboardingInput(
        child_name=profile.child_name,
        age_group=profile.age_group,
        restrictions=tuple(profile.restrictions),
        dietary_pattern=profile.dietary_pattern,
        safe_foods=tuple(
            SafeFoodInput(item.name, item.preparation, item.presentation_note)
            for item in profile.safe_foods
        ),
        consents=tuple(ConsentInput(item.kind, item.granted) for item in payload.consents),
    )


def _response(snapshot: OnboardingSnapshot) -> OnboardingResponse:
    profile = snapshot.profile
    profile_dto = None
    if profile is not None:
        profile_dto = UserProfileDto(
            user_id=str(profile.user_id),
            child_name=profile.child_name,
            age_group=profile.age_group,
            restrictions=[RestrictionType(item) for item in profile.restrictions],
            dietary_pattern=profile.dietary_pattern,
            safe_foods=[
                SafeFoodDto(
                    id=str(food.id),
                    name=food.name,
                    preparation=food.preparation,
                    presentation_note=food.presentation_note,
                )
                for food in snapshot.safe_foods
            ],
            updated_at=profile.updated_at,
        )
    return OnboardingResponse(
        profile=profile_dto,
        consents=[
            UserConsentDto(
                id=str(row.id),
                user_id=str(row.user_id),
                kind=row.kind,
                granted=row.granted,
                document_version=row.document_version,
                recorded_at=row.recorded_at,
            )
            for row in snapshot.consents
        ],
    )


@router.get("", response_model=OnboardingResponse)
async def read_onboarding(
    current_user: CurrentUser,
    service: Annotated[OnboardingService, Depends(get_onboarding_service)],
) -> OnboardingResponse:
    return _response(await service.read(current_user.id))


@router.put("", response_model=OnboardingResponse)
async def write_onboarding(
    payload: OnboardingWriteRequest,
    current_user: CurrentUser,
    service: Annotated[OnboardingService, Depends(get_onboarding_service)],
) -> OnboardingResponse:
    return _response(await service.write(current_user.id, _input(payload)))
