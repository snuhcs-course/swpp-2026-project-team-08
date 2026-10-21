"""Read and resolve ingredients from the shared catalog."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.features.ingredients.queries import resolve_ingredient
from app.models.ingredient import Ingredient


class IngredientNotFoundError(AppError):
    pass


class IngredientService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Ingredient]:
        return list((await self._session.scalars(select(Ingredient).order_by(Ingredient.id))).all())

    async def resolve(self, *, ingredient_id: str | None, name: str) -> Ingredient:
        ingredient = await resolve_ingredient(self._session, ingredient_id=ingredient_id, name=name)
        if ingredient is None:
            raise IngredientNotFoundError()
        return ingredient
