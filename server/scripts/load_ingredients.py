# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 재료·제한 판정 raw JSONL 을 DB 에 한 번 적재하는 스크립트 추가
# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 영어 카탈로그 검증과 명시적 전체 교체

"""영어 재료 카탈로그와 제한 판정 JSONL을 검증하거나 DB 카탈로그 전체를 교체한다.

기본 입력은 저장소의 data/ingredient_db/result/에 있는 JSONL 두 파일이다.

    uv run python scripts/load_ingredients.py --check
    uv run python scripts/load_ingredients.py --replace-catalog

교체는 파일 검증 후 한 트랜잭션에서 수행한다. 파일에 없는 기존 재료와 판정도 제거한다.
사용자가 기록한 식사 재료와 저장된 추천은 변경하지 않는다.
"""

import argparse
import asyncio
import json
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import delete, func, select, text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.features.suggestions.ingredients import normalize_name  # noqa: E402
from app.models import Ingredient, IngredientRestriction  # noqa: E402
from app.models.ingredient_enums import RestrictionDegree  # noqa: E402
from app.models.restriction_enums import RestrictionType  # noqa: E402

RESULT = ROOT.parent / "data" / "ingredient_db" / "result"
CHUNK = 1000


@dataclass(frozen=True)
class ImportResult:
    ingredients: int
    restrictions: int


def _unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def read_jsonl(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as file:
        return [json.loads(line, object_pairs_hook=_unique_object) for line in file if line.strip()]


def valid_english_name(name: str) -> bool:
    letters = [character for character in name if character.isalpha()]
    return (
        bool(letters)
        and all(unicodedata.name(character, "").startswith("LATIN ") for character in letters)
        and not any(unicodedata.category(character).startswith("C") for character in name)
    )


def validate(
    ingredients: list[dict], restrictions: list[dict]
) -> tuple[dict[int, str], list[tuple[int, RestrictionType, RestrictionDegree]]]:
    """영어 이름, ID와 판정 값을 확인한다. 없는 판정은 미판정으로 남긴다."""
    if not ingredients:
        raise ValueError("ingredient catalog is empty")
    names: dict[int, str] = {}
    normalized_names: set[str] = set()
    for row in ingredients:
        if not isinstance(row, dict) or set(row) != {"id", "korean_name", "english_name"}:
            raise ValueError(f"invalid ingredient fields: {row}")
        ingredient_id = row["id"]
        name = row["english_name"]
        if (
            type(ingredient_id) is not int
            or not 1 <= ingredient_id <= 2**63 - 1
            or row["korean_name"] is not None
            or not isinstance(name, str)
            or not valid_english_name(name)
        ):
            raise ValueError(f"invalid ingredient row: {row}")
        if ingredient_id in names:
            raise ValueError(f"duplicate ingredient id: {ingredient_id}")
        normalized = normalize_name(name)
        if normalized in normalized_names:
            raise ValueError(f"duplicate ingredient name: {name}")
        normalized_names.add(normalized)
        names[ingredient_id] = name.strip()
    judged: list[tuple[int, RestrictionType, RestrictionDegree]] = []
    seen: set[tuple[int, RestrictionType]] = set()
    for row in restrictions:
        if not isinstance(row, dict) or set(row) != {"ingredient_id", "restriction_type", "degree"}:
            raise ValueError(f"invalid restriction fields: {row}")
        ingredient_id = row["ingredient_id"]
        if type(ingredient_id) is not int or ingredient_id not in names:
            raise ValueError(f"unknown ingredient id: {row}")
        restriction_type = RestrictionType(row["restriction_type"])
        degree = RestrictionDegree(row["degree"])
        key = (ingredient_id, restriction_type)
        # ALLERGY.NONE 은 재료의 판정에 쓰지 않는다.
        if restriction_type == RestrictionType.ALLERGY_NONE:
            raise ValueError(f"ALLERGY.NONE cannot be judged: {row}")
        if key in seen:
            raise ValueError(f"duplicate judgement: {row}")
        seen.add(key)
        judged.append((ingredient_id, restriction_type, degree))
    return names, judged


async def import_catalog(
    session: AsyncSession,
    ingredients_path: Path,
    restrictions_path: Path,
    *,
    replace_catalog: bool,
) -> ImportResult:
    if not replace_catalog:
        raise ValueError("catalog replacement must be explicit")
    names, judged = validate(read_jsonl(ingredients_path), read_jsonl(restrictions_path))

    async with session.begin_nested():
        await session.execute(delete(IngredientRestriction))
        await session.execute(delete(Ingredient))
        session.add_all(
            Ingredient(id=ingredient_id, korean_name=None, english_name=name)
            for ingredient_id, name in names.items()
        )
        await session.flush()
        for start in range(0, len(judged), CHUNK):
            session.add_all(
                IngredientRestriction(
                    ingredient_id=ingredient_id, restriction_type=kind, degree=degree
                )
                for ingredient_id, kind, degree in judged[start : start + CHUNK]
            )
            await session.flush()
        await sync_ingredient_sequence(session)
    return ImportResult(ingredients=len(names), restrictions=len(judged))


async def sync_ingredient_sequence(session: AsyncSession) -> None:
    """직접 넣은 ID 뒤로 시퀀스를 올리되, 롤백 때 충돌하지 않도록 낮추지 않는다."""
    if session.get_bind().dialect.name != "postgresql":
        return
    highest = await session.scalar(select(func.max(Ingredient.id)))
    if highest is not None:
        await session.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('ingredients', 'id'), "
                "GREATEST(:highest, nextval(pg_get_serial_sequence('ingredients', 'id'))))"
            ),
            {"highest": highest},
        )


async def run(ingredients_path: Path, restrictions_path: Path) -> ImportResult:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session, session.begin():
        return await import_catalog(
            session, ingredients_path, restrictions_path, replace_catalog=True
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ingredients", type=Path, default=RESULT / "ingredients.jsonl")
    parser.add_argument(
        "--restrictions", type=Path, default=RESULT / "ingredients_restrictions.jsonl"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="파일만 검증하고 DB는 바꾸지 않는다")
    mode.add_argument(
        "--replace-catalog", action="store_true", help="기존 공용 재료와 판정을 모두 교체한다"
    )
    args = parser.parse_args()
    if args.check:
        names, judged = validate(read_jsonl(args.ingredients), read_jsonl(args.restrictions))
        print(f"OK: 재료 {len(names)}개, 제한 판정 {len(judged)}개 (DB 는 바꾸지 않았다)")
        return
    result = asyncio.run(run(args.ingredients, args.restrictions))
    print(f"적재 완료: 재료 {result.ingredients}개, 제한 판정 {result.restrictions}개")


if __name__ == "__main__":
    main()
