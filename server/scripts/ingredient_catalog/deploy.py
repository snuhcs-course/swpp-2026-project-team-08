# AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung
# Changed: CLI의 트랜잭션에서 재료 변경 감지·적재·DB 검증

"""배포 이미지의 재료 목록을 DB와 동기화하고 검증한다."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Ingredient, IngredientCatalogState, IngredientRestriction
from scripts.ingredient_catalog.load import CatalogInput, replace_catalog_data


@dataclass(frozen=True)
class ApplyResult:
    changed: bool
    ingredients: int
    restrictions: int


async def apply_catalog(session: AsyncSession, catalog: CatalogInput) -> ApplyResult:
    state = await session.get(IngredientCatalogState, 1)
    changed = state is None or state.content_hash != catalog.content_hash
    if changed:
        await replace_catalog_data(session, catalog)
    return ApplyResult(changed, len(catalog.names), len(catalog.judgements))


async def verify_catalog(session: AsyncSession, catalog: CatalogInput) -> None:
    """행 수뿐 아니라 모든 재료 이름·제한 값과 적재 해시를 확인한다."""
    state = await session.get(IngredientCatalogState, 1)
    names = list(
        (
            await session.execute(
                select(Ingredient.id, Ingredient.korean_name, Ingredient.english_name).order_by(
                    Ingredient.id
                )
            )
        ).all()
    )
    judgements = list(
        (
            await session.execute(
                select(
                    IngredientRestriction.ingredient_id,
                    IngredientRestriction.restriction_type,
                    IngredientRestriction.degree,
                )
            )
        ).all()
    )
    if (
        state is None
        or state.content_hash != catalog.content_hash
        or names != [(key, None, name) for key, name in sorted(catalog.names.items())]
        or sorted(judgements) != sorted(catalog.judgements)
    ):
        raise ValueError("DB catalog does not match the deployment JSONL")
