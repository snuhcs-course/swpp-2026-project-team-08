"""Authenticated shared ingredient catalog API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.database import get_session
from app.features.auth.dependencies import CurrentUser
from app.features.ingredients.dto import IngredientResolveRequest, IngredientResponse
from app.features.ingredients.service import IngredientNotFoundError, IngredientService
from app.models.ingredient import Ingredient

router = APIRouter(prefix="/ingredients", tags=["ingredients"], route_class=ErrorMappedRoute)


def get_ingredient_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> IngredientService:
    return IngredientService(session)


def _response(ingredient: Ingredient) -> IngredientResponse:
    return IngredientResponse(id=str(ingredient.id), name=ingredient.name)


@router.get("", response_model=list[IngredientResponse])
async def list_ingredients(
    _current_user: CurrentUser,
    service: Annotated[IngredientService, Depends(get_ingredient_service)],
) -> list[IngredientResponse]:
    return [_response(item) for item in await service.list_all()]


@router.post("/resolve", response_model=IngredientResponse)
@error_specs({
    IngredientNotFoundError: ErrorSpec(status_code=404, error_code="INGREDIENT_NOT_FOUND"),
})
async def resolve_ingredient(
    payload: IngredientResolveRequest,
    _current_user: CurrentUser,
    service: Annotated[IngredientService, Depends(get_ingredient_service)],
) -> IngredientResponse:
    return _response(await service.resolve(ingredient_id=payload.id, name=payload.name))
