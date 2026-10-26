"""Authenticated onboarding API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.onboarding.dto import (
    OnboardingResponse,
    OnboardingWriteRequest,
    ProfileChoiceDto,
    SafeFoodDto,
    SafeFoodsDto,
    UserConsentDto,
    UserProfileDto,
)
from app.features.onboarding.service import (
    ChoiceInput,
    ConsentInput,
    OnboardingInput,
    OnboardingService,
    OnboardingSnapshot,
    SafeFoodInput,
    SafeFoodNotFoundError,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"], route_class=ErrorMappedRoute)


def get_onboarding_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OnboardingService:
    return OnboardingService(session)


def _input(payload: OnboardingWriteRequest) -> OnboardingInput:
    profile = payload.profile
    preferences = profile.food_preferences
    groups = (
        ("allergy", profile.safety.allergies.items),
        ("restriction", profile.safety.restrictions.items),
        ("family_food", preferences.family_foods),
        ("difficult_texture", preferences.difficult_textures),
        ("difficult_taste", preferences.difficult_tastes),
        ("presentation_preference", preferences.presentation_preferences),
    )
    choices = tuple(
        ChoiceInput(category, position, item.code, item.custom_name)
        for category, items in groups
        for position, item in enumerate(items)
    )
    foods = tuple(
        SafeFoodInput(
            int(item.id) if item.id is not None else None,
            position,
            item.name,
            item.preparation,
            item.presentation_note,
        )
        for position, item in enumerate(profile.safe_foods.items)
    )
    return OnboardingInput(
        child_name=profile.child_name,
        age_group=profile.age_group,
        allergy_status=profile.safety.allergies.status,
        restriction_status=profile.safety.restrictions.status,
        smell_sensitivity=preferences.smell_sensitivity,
        preferred_temperature=preferences.preferred_temperature,
        new_food_response=preferences.new_food_response,
        safe_food_status=profile.safe_foods.status,
        choices=choices,
        safe_foods=foods,
        consents=tuple(ConsentInput(item.kind, item.granted) for item in payload.consents),
    )


def _response(snapshot: OnboardingSnapshot) -> OnboardingResponse:
    profile = snapshot.profile
    profile_dto = None
    if profile is not None:
        groups: dict[str, list[ProfileChoiceDto]] = {}
        for row in snapshot.choices:
            groups.setdefault(row.category, []).append(
                ProfileChoiceDto(code=row.code, custom_name=row.custom_name)
            )
        profile_dto = UserProfileDto(
            user_id=str(profile.user_id),
            child_name=profile.child_name,
            age_group=profile.age_group,
            safety={
                "allergies": {"status": profile.allergy_status, "items": groups.get("allergy", [])},
                "restrictions": {
                    "status": profile.restriction_status,
                    "items": groups.get("restriction", []),
                },
            },
            food_preferences={
                "family_foods": groups.get("family_food", []),
                "difficult_textures": groups.get("difficult_texture", []),
                "smell_sensitivity": profile.smell_sensitivity,
                "difficult_tastes": groups.get("difficult_taste", []),
                "presentation_preferences": groups.get("presentation_preference", []),
                "preferred_temperature": profile.preferred_temperature,
                "new_food_response": profile.new_food_response,
            },
            safe_foods=SafeFoodsDto(
                status=profile.safe_food_status,
                items=[
                    SafeFoodDto(
                        id=str(food.id),
                        name=food.name,
                        preparation=food.preparation,
                        presentation_note=food.presentation_note,
                    )
                    for food in snapshot.safe_foods
                ],
            ),
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
@error_specs({SafeFoodNotFoundError: ErrorSpec(status_code=422, error_code="SAFE_FOOD_NOT_FOUND")})
async def write_onboarding(
    payload: OnboardingWriteRequest,
    current_user: CurrentUser,
    service: Annotated[OnboardingService, Depends(get_onboarding_service)],
) -> OnboardingResponse:
    return _response(await service.write(current_user.id, _input(payload)))
