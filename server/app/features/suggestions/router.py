# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
"""Suggestion API and error mapping. Child scope follows the existing meal-log API."""

from datetime import date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.meal_logs.queries import get_meal
from app.features.suggestions.rules import targets_for, utc
from app.features.suggestions.service import (
    GenerationFailedError,
    SelectionChangedError,
    SourceUnavailableError,
    SuggestionConflictError,
    SuggestionNotFoundError,
    SuggestionService,
)
from app.models import SuggestionTry

router = APIRouter(
    prefix="/children/{child_id}/suggestions", tags=["suggestions"], route_class=ErrorMappedRoute
)
ERRORS = {
    SuggestionNotFoundError: ErrorSpec(status_code=404, error_code="SUGGESTION_NOT_FOUND"),
    SourceUnavailableError: ErrorSpec(status_code=404, error_code="SOURCE_UNAVAILABLE"),
    SelectionChangedError: ErrorSpec(status_code=409, error_code="SELECTION_CHANGED"),
    SuggestionConflictError: ErrorSpec(status_code=409, error_code="SUGGESTION_CONFLICT"),
    GenerationFailedError: ErrorSpec(status_code=502, error_code="GENERATION_FAILED"),
}


def get_service(session: Annotated[AsyncSession, Depends(get_session)]) -> SuggestionService:
    return SuggestionService(session)


Service = Annotated[SuggestionService, Depends(get_service)]


class GenerateRequest(BaseModel):
    selected_food_ids: list[str] | None = None


class DecisionRequest(BaseModel):
    action_id: str = Field(min_length=1, max_length=80)
    version: int = Field(ge=0)
    status: Literal["saved", "dismissed"]
    reasons: list[
        Literal[
            "restriction_conflict",
            "disliked_food_or_form",
            "food_preferences",
            "too_much_preparation",
            "ingredient_unavailable",
            "already_tried",
            "not_suitable",
            "too_difficult",
            "other",
        ]
    ] = Field(default_factory=list, max_length=6)


class UndoRequest(BaseModel):
    action_id: str


class SavedRequest(BaseModel):
    saved: bool


class TryRequest(BaseModel):
    meal_id: str
    target_id: str


class FeedbackRequest(BaseModel):
    feedback: Literal["helpful", "not_helpful", "not_sure"]


class TryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    meal_id: str
    target_id: str
    tried_on: date
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"] | None = None
    feedback: str | None
    linked_available: bool = False


class ContentResponse(BaseModel):
    food_id: str
    food_name: str
    ingredients: list[str]
    preparation: str
    meal_date: date
    meal_type: str
    what_to_try: str
    why_this_may_help: str
    serving_tip: str
    linked_reason: list[dict] = Field(default_factory=list)


class SuggestionResponse(BaseModel):
    id: str
    child_id: str
    meal_id: str
    food_id: str
    revision: str
    content: ContentResponse
    status: str
    dismiss_reasons: list[str]
    saved_at: datetime | None
    created_at: datetime
    version: int
    tries: list[TryResponse]


class BatchResponse(BaseModel):
    revision: str
    selected_food_ids: list[str]
    items: list[SuggestionResponse]


class EligibleTargetResponse(BaseModel):
    id: str
    name: str
    food_id: str


class EligibleMealResponse(BaseModel):
    id: str
    meal_date: date
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    reviewed: bool
    foods: list[str]
    targets: list[EligibleTargetResponse]


async def try_response(
    service: SuggestionService, child_id: str, tried: SuggestionTry
) -> TryResponse:
    meal = await get_meal(service.session, tried.meal_id)
    available = meal is not None and meal.child_id == child_id
    return TryResponse.model_validate(tried).model_copy(
        update={
            "linked_available": available,
            "meal_type": meal.meal_type if available else None,
        }
    )


async def response(service: SuggestionService, item) -> SuggestionResponse:
    tries = [
        await try_response(service, item.child_id, tried) for tried in await service.tries(item.id)
    ]
    return SuggestionResponse(
        **{
            key: (
                utc(getattr(item, key))
                if key in ("created_at", "saved_at") and getattr(item, key) is not None
                else getattr(item, key)
            )
            for key in (
                "id",
                "child_id",
                "meal_id",
                "food_id",
                "revision",
                "content",
                "status",
                "dismiss_reasons",
                "saved_at",
                "created_at",
                "version",
            )
        },
        tries=tries,
    )


@router.post("/meals/{meal_id}/generate", response_model=BatchResponse)
@error_specs(ERRORS)
async def generate(child_id: str, meal_id: str, payload: GenerateRequest, service: Service):
    batch, items = await service.batch(child_id, meal_id, payload.selected_food_ids)
    return BatchResponse(
        revision=batch.revision,
        selected_food_ids=batch.selected_food_ids,
        items=[await response(service, item) for item in items],
    )


@router.get("", response_model=list[SuggestionResponse])
@error_specs(ERRORS)
async def saved(child_id: str, service: Service):
    return [await response(service, item) for item in await service.saved(child_id)]


@router.get("/{suggestion_id}", response_model=SuggestionResponse)
@error_specs(ERRORS)
async def detail(child_id: str, suggestion_id: str, service: Service):
    return await response(service, await service.item(child_id, suggestion_id))


@router.put("/{suggestion_id}/decision", response_model=SuggestionResponse)
@error_specs(ERRORS)
async def decide(child_id: str, suggestion_id: str, payload: DecisionRequest, service: Service):
    return await response(
        service, await service.decide(child_id, suggestion_id, **payload.model_dump())
    )


@router.post("/{suggestion_id}/undo", response_model=SuggestionResponse)
@error_specs(ERRORS)
async def undo(child_id: str, suggestion_id: str, payload: UndoRequest, service: Service):
    return await response(service, await service.undo(child_id, suggestion_id, payload.action_id))


@router.put("/{suggestion_id}/saved", response_model=SuggestionResponse)
@error_specs(ERRORS)
async def set_saved(child_id: str, suggestion_id: str, payload: SavedRequest, service: Service):
    return await response(service, await service.set_saved(child_id, suggestion_id, payload.saved))


@router.get("/{suggestion_id}/eligible-meals", response_model=list[EligibleMealResponse])
@error_specs({SuggestionNotFoundError: ERRORS[SuggestionNotFoundError]})
async def eligible(
    child_id: str, suggestion_id: str, service: Service
) -> list[EligibleMealResponse]:
    meals = await service.eligible(child_id, suggestion_id)
    return [
        EligibleMealResponse(
            id=m.id,
            meal_date=m.meal_date,
            meal_type=m.meal_type,
            reviewed=m.review is not None,
            foods=[f.name for f in m.foods],
            targets=[EligibleTargetResponse(**target) for target in targets_for(m)],
        )
        for m in meals
    ]


@router.post("/{suggestion_id}/tries", response_model=TryResponse)
@error_specs(ERRORS)
async def record_try(child_id: str, suggestion_id: str, payload: TryRequest, service: Service):
    tried = await service.record_try(child_id, suggestion_id, **payload.model_dump())
    return await try_response(service, child_id, tried)


@router.put("/{suggestion_id}/tries/{try_id}/feedback", response_model=TryResponse)
@error_specs(ERRORS)
async def feedback(
    child_id: str, suggestion_id: str, try_id: str, payload: FeedbackRequest, service: Service
):
    tried = await service.feedback(child_id, suggestion_id, try_id, payload.feedback)
    return await try_response(service, child_id, tried)
