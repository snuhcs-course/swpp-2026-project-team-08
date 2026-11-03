# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 재료·제한 판정 raw JSONL 을 DB 에 한 번 적재하는 스크립트 추가

"""재료 카탈로그와 제한 판정의 raw JSONL(`assets/`)을 DB 에 적재한다.

서버에 접속해 한 번 실행하는 운영 스크립트이며 DB 데이터를 바꾼다. 실행 전에 대상 DB 를 확인한다.

    uv run python scripts/load_ingredients.py --check   # 파일만 검증하고 DB 는 건드리지 않는다
    uv run python scripts/load_ingredients.py           # DB 에 적재한다

파일을 기준으로 삼아 여러 번 실행해도 결과가 같다.
- `ingredients`: `id` 로 찾아 `korean_name` 을 갱신하고 없으면 만든다.
  파일에 없는 재료는 건드리지 않는다.
- `ingredient_restrictions`: 파일에 있는 재료의 판정을 모두 지우고 파일의 판정으로 바꾼다.
값이 하나라도 현재 enum 과 맞지 않으면 아무것도 쓰기 전에 오류로 끝난다.
"""

import argparse
import asyncio
import json
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import delete, func, select, text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.models import Ingredient, IngredientRestriction  # noqa: E402
from app.models.ingredient_enums import RestrictionDegree  # noqa: E402
from app.models.restriction_enums import RestrictionType  # noqa: E402

ASSETS = ROOT / "assets"
CHUNK = 1000


@dataclass(frozen=True)
class ImportResult:
    ingredients: int
    restrictions: int


def read_jsonl(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as file:
        return [json.loads(line) for line in file if line.strip()]


def validate(
    ingredients: list[dict], restrictions: list[dict]
) -> tuple[dict[int, str], list[tuple[int, RestrictionType, RestrictionDegree]]]:
    """파일의 값이 현재 enum 과 맞는지 확인하고 (재료 id → 이름, 판정 목록)을 돌려준다."""
    names: dict[int, str] = {}
    for row in ingredients:
        name = row["korean_name"]
        if not isinstance(row["id"], int) or not isinstance(name, str) or not name.strip():
            raise ValueError(f"invalid ingredient row: {row}")
        if row["id"] in names:
            raise ValueError(f"duplicate ingredient id: {row['id']}")
        names[row["id"]] = name
    judged: list[tuple[int, RestrictionType, RestrictionDegree]] = []
    seen: set[tuple[int, RestrictionType]] = set()
    for row in restrictions:
        restriction_type = RestrictionType(row["restriction_type"])
        degree = RestrictionDegree(row["degree"])
        key = (row["ingredient_id"], restriction_type)
        # ALLERGY.NONE 은 재료의 판정에 쓰지 않는다.
        if restriction_type == RestrictionType.ALLERGY_NONE:
            raise ValueError(f"ALLERGY.NONE cannot be judged: {row}")
        if row["ingredient_id"] not in names:
            raise ValueError(f"unknown ingredient id: {row}")
        if key in seen:
            raise ValueError(f"duplicate judgement: {row}")
        seen.add(key)
        judged.append((row["ingredient_id"], restriction_type, degree))
    return names, judged


async def import_catalog(
    session: AsyncSession, ingredients_path: Path, restrictions_path: Path
) -> ImportResult:
    names, judged = validate(read_jsonl(ingredients_path), read_jsonl(restrictions_path))

    ids = list(names)
    existing: dict[int, Ingredient] = {}
    for start in range(0, len(ids), CHUNK):
        chunk = ids[start : start + CHUNK]
        rows = await session.scalars(select(Ingredient).where(Ingredient.id.in_(chunk)))
        existing.update({item.id: item for item in rows.all()})
    for ingredient_id, name in names.items():
        if ingredient_id in existing:
            existing[ingredient_id].korean_name = name
        else:
            session.add(Ingredient(id=ingredient_id, korean_name=name))
    await session.flush()

    for start in range(0, len(ids), CHUNK):
        await session.execute(
            delete(IngredientRestriction).where(
                IngredientRestriction.ingredient_id.in_(ids[start : start + CHUNK])
            )
        )
    for start in range(0, len(judged), CHUNK):
        session.add_all(
            IngredientRestriction(ingredient_id=ingredient_id, restriction_type=kind, degree=degree)
            for ingredient_id, kind, degree in judged[start : start + CHUNK]
        )
        await session.flush()
    await sync_ingredient_sequence(session)
    return ImportResult(ingredients=len(names), restrictions=len(judged))


async def sync_ingredient_sequence(session: AsyncSession) -> None:
    """id 를 직접 넣었으므로 Postgres 의 자동 증가 값을 최대 id 뒤로 맞춘다."""
    if session.get_bind().dialect.name != "postgresql":
        return
    highest = await session.scalar(select(func.max(Ingredient.id)))
    if highest is not None:
        await session.execute(
            text("SELECT setval(pg_get_serial_sequence('ingredients', 'id'), :highest)"),
            {"highest": highest},
        )


async def run(ingredients_path: Path, restrictions_path: Path) -> ImportResult:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session, session.begin():
        return await import_catalog(session, ingredients_path, restrictions_path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ingredients", type=Path, default=ASSETS / "ingredients.jsonl")
    parser.add_argument(
        "--restrictions", type=Path, default=ASSETS / "ingredients_restrictions.jsonl"
    )
    parser.add_argument("--check", action="store_true", help="파일만 검증하고 DB 는 바꾸지 않는다")
    args = parser.parse_args()
    if args.check:
        names, judged = validate(read_jsonl(args.ingredients), read_jsonl(args.restrictions))
        print(f"OK: 재료 {len(names)}개, 제한 판정 {len(judged)}개 (DB 는 바꾸지 않았다)")
        return
    result = asyncio.run(run(args.ingredients, args.restrictions))
    print(f"적재 완료: 재료 {result.ingredients}개, 제한 판정 {result.restrictions}개")


if __name__ == "__main__":
    main()
