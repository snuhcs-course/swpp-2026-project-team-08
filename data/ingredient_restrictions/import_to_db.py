# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""검토 데이터 검증 및 PostgreSQL 적재. 기본 실행은 검증만 한다."""

import argparse
import asyncio
import json
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))

from app.core.config import Settings  # noqa: E402
from app.models import Ingredient, IngredientRestriction, Restriction  # noqa: E402
from sqlalchemy import delete, insert, select, text  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402


@dataclass(frozen=True)
class Dataset:
    ingredients: list[dict]
    restrictions: list[dict]
    decisions: list[dict]
    omitted: int


def read_dataset() -> Dataset:
    ingredients = json.loads(
        (ROOT / "data/ingredient_db/ingredients-reviewed.json").read_text(
            encoding="utf-8"
        )
    )["ingredients"]
    restrictions = json.loads(
        (ROOT / "data/ingredient_db/restrictions.json").read_text(encoding="utf-8")
    )["restrictions"]
    rows = json.loads(
        (ROOT / "data/ingredient_restrictions/relations-reviewed.json").read_text(
            encoding="utf-8"
        )
    )["rows"]
    names = {i["kor_name"] for i in ingredients}
    ids = {r["id"] for r in restrictions}
    if len(names) != len(ingredients) or len(ids) != len(restrictions):
        raise ValueError("Duplicate ingredient or restriction")
    if any(not i["kor_name"].strip() or not i["eng_name"].strip() for i in ingredients):
        raise ValueError("Empty ingredient name")
    seen = set()
    decisions = []
    for row in rows:
        key = row["ingredient_key"], row["restriction_id"]
        if key in seen or key[0] not in names or key[1] not in ids:
            raise ValueError(f"Invalid or duplicate pair: {key}")
        seen.add(key)
        if row["review_status"] == "UNRESOLVED" and row["relation"] is None:
            continue
        if row["review_status"] != "DECIDED" or row["relation"] not in {
            "ALWAYS",
            "NEVER",
            "DEPENDS_ON_PRODUCT",
        }:
            raise ValueError(f"Invalid decision: {key}")
        decisions.append(row)
    if len(seen) != len(names) * len(ids):
        raise ValueError("Incomplete dataset")
    return Dataset(ingredients, restrictions, decisions, len(rows) - len(decisions))


async def import_dataset(session, dataset: Dataset) -> None:
    """호출자의 트랜잭션 안에서 반영한다. 기존 ID와 대상 밖 행은 유지한다."""
    # 동시 ID 할당·쓰기를 막는다. 기존 식사에서 참조하는 ID는 바꾸지 않는다.
    await session.execute(
        text(
            "LOCK TABLE ingredients, restrictions, ingredient_restrictions "
            "IN SHARE ROW EXCLUSIVE MODE"
        )
    )
    existing = {
        item.name: item for item in (await session.scalars(select(Ingredient))).all()
    }
    next_id = max((item.id for item in existing.values()), default=0) + 1
    for row in dataset.ingredients:
        item = existing.get(row["kor_name"])
        if item is None:
            item = Ingredient(id=next_id, name=row["kor_name"])
            existing[item.name] = item
            session.add(item)
            next_id += 1
        item.eng_name = row["eng_name"]
    for row in dataset.restrictions:
        item = await session.get(Restriction, row["id"])
        if item is None:
            session.add(Restriction(**row))
        else:
            item.name, item.type = row["name"], row["type"]
    await session.flush()
    ingredient_ids = [existing[row["kor_name"]].id for row in dataset.ingredients]
    # 다시 가져올 때 보류로 바뀐 쌍의 오래된 NEVER를 남기지 않는다.
    await session.execute(
        delete(IngredientRestriction).where(
            IngredientRestriction.ingredient_id.in_(ingredient_ids),
            IngredientRestriction.restriction_id.in_(
                [r["id"] for r in dataset.restrictions]
            ),
        )
    )
    values = [
        dict(
            ingredient_id=existing[r["ingredient_key"]].id,
            restriction_id=r["restriction_id"],
            relation=r["relation"],
        )
        for r in dataset.decisions
    ]
    for start in range(0, len(values), 1000):
        await session.execute(
            insert(IngredientRestriction), values[start : start + 1000]
        )


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--apply-local", action="store_true")
    target.add_argument("--apply-production", action="store_true")
    args = parser.parse_args()
    dataset = read_dataset()
    print(
        f"ingredients={len(dataset.ingredients)}, restrictions={len(dataset.restrictions)}, "
        f"decisions={len(dataset.decisions)}, omitted={dataset.omitted}"
    )
    if not (args.apply_local or args.apply_production):
        print("Validation only; use --apply-local or --apply-production to import.")
        return
    settings = Settings(_env_file=ROOT / "server/.env")
    if args.apply_local and (settings.ENVIRONMENT != "local" or settings.POSTGRES_HOST not in {
        "localhost",
        "127.0.0.1",
        "::1",
    }):
        raise ValueError("Only local PostgreSQL is supported")
    if args.apply_production and settings.ENVIRONMENT != "production":
        raise ValueError("--apply-production requires ENVIRONMENT=production")
    engine = create_async_engine(settings.database_url)
    try:
        async with async_sessionmaker(engine).begin() as session:
            await import_dataset(session, dataset)
        print(f"Imported into {settings.ENVIRONMENT} DB in one transaction.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
