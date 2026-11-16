# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 배포 시 재료 변경 감지·적재·검증 명령

"""배포 이미지의 재료 목록을 DB와 동기화하고 검증한다."""

import argparse
import asyncio
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Ingredient, IngredientCatalogState, IngredientRestriction
from scripts.ingredient_catalog.load import RESULT, CatalogInput, read_catalog, replace_catalog_data
from scripts.ingredient_catalog.lock import lock_catalog


@dataclass(frozen=True)
class ApplyResult:
    changed: bool
    ingredients: int
    restrictions: int


async def apply_catalog(session: AsyncSession, catalog: CatalogInput) -> ApplyResult:
    await lock_catalog(session)
    state = await session.get(IngredientCatalogState, 1)
    changed = state is None or state.content_hash != catalog.content_hash
    if changed:
        await replace_catalog_data(session, catalog)
    return ApplyResult(changed, len(catalog.names), len(catalog.judgements))


async def verify_catalog(session: AsyncSession, catalog: CatalogInput) -> None:
    """행 수뿐 아니라 모든 재료 이름·제한 값과 적재 해시를 확인한다."""
    await lock_catalog(session)
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


async def run(args: argparse.Namespace) -> None:
    # 파일 검증 실패는 DB 연결 전에 처리한다.
    catalog = read_catalog(args.ingredients, args.restrictions)
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session, session.begin():
        if args.command == "apply":
            result = await apply_catalog(session, catalog)
        elif args.command == "verify":
            await verify_catalog(session, catalog)
    # commit이 끝난 뒤에만 성공을 출력한다.
    if args.command == "apply":
        action = "교체 완료" if result.changed else "동일 파일: 교체 생략"
        print(f"{action} (재료 {result.ingredients}개, 제한 판정 {result.restrictions}개)")
    else:
        print(f"재료 {args.command} 완료")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for command in ("apply", "verify"):
        child = commands.add_parser(command)
        child.add_argument("--ingredients", type=Path, default=RESULT / "ingredients.jsonl")
        child.add_argument(
            "--restrictions", type=Path, default=RESULT / "ingredients_restrictions.jsonl"
        )
    asyncio.run(run(parser.parse_args()))


if __name__ == "__main__":
    main()
