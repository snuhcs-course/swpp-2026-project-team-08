# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 카탈로그 쿼리와 재료·제한 판정 적재 스크립트 검증 추가
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

"""쓸 수 있는 재료 쿼리(`catalog.py`)와 적재 스크립트(`scripts/load_ingredients.py`) 테스트."""

import json
from pathlib import Path

import pytest
from sqlalchemy import select

from app.core.database import get_session
from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.ingredients import ChildRestrictions
from app.main import app
from app.models import Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType
from scripts.load_ingredients import import_catalog, read_jsonl, validate

NEVER = RestrictionDegree.NEVER
EGGS = RestrictionType.ALLERGY_EGGS
DAIRY = RestrictionType.VEGETARIAN_DAIRY
ASSETS = Path(__file__).resolve().parents[2] / "assets"


async def with_session(action):
    # 세션을 루프 밖으로 돌려주면 커밋되기 전에 닫히므로, 안에서 모두 처리하고 결과만 꺼낸다.
    result = None
    async for session in app.dependency_overrides[get_session]():
        result = await action(session)
    return result


async def seed(session) -> None:
    rows = {
        "쌀": {EGGS: NEVER, DAIRY: NEVER},
        "우유": {EGGS: NEVER, DAIRY: RestrictionDegree.ALWAYS},
        "빵": {EGGS: RestrictionDegree.DEPENDS_ON_PRODUCT, DAIRY: NEVER},
        "당근": {EGGS: NEVER},  # 채식 판정이 없다
        "판정 없음": {},
    }
    for name, judgements in rows.items():
        ingredient = Ingredient(korean_name=name)
        session.add(ingredient)
        await session.flush()
        session.add_all(
            IngredientRestriction(ingredient_id=ingredient.id, restriction_type=kind, degree=degree)
            for kind, degree in judgements.items()
        )
    session.add(Ingredient(korean_name=None, english_name="no korean name"))


async def names_for(*types: RestrictionType) -> set[str]:
    async def action(session):
        catalog = await load_catalog(session, ChildRestrictions(frozenset(types)))
        return set(catalog.names.values())

    return await with_session(action)


async def test_catalog_requires_a_never_judgement_for_every_restriction(api_client) -> None:
    await with_session(seed)

    assert await names_for(EGGS, DAIRY) == {"쌀"}
    # 한 제한만 보면 그 제한에 NEVER 가 있는 재료가 모두 쓸 수 있다.
    assert await names_for(EGGS) == {"쌀", "우유", "당근"}
    assert await names_for(DAIRY) == {"쌀", "빵"}


async def test_catalog_without_restrictions_lists_every_named_ingredient(api_client) -> None:
    await with_session(seed)

    assert await names_for() == {"쌀", "우유", "빵", "당근", "판정 없음"}


async def test_catalog_is_empty_when_nothing_is_judged_for_the_restriction(api_client) -> None:
    await with_session(seed)

    assert await names_for(RestrictionType.ALLERGY_PEANUTS) == set()


def write_files(tmp_path: Path, ingredients: list[dict], restrictions: list[dict]):
    first, second = tmp_path / "ingredients.jsonl", tmp_path / "restrictions.jsonl"
    first.write_text("\n".join(json.dumps(row) for row in ingredients), encoding="utf-8")
    second.write_text("\n".join(json.dumps(row) for row in restrictions), encoding="utf-8")
    return first, second


def judged(ingredient_id: int, kind: str, degree: str = "NEVER") -> dict:
    return {"ingredient_id": ingredient_id, "restriction_type": kind, "degree": degree}


async def test_import_is_repeatable_and_replaces_the_judgements_of_listed_ingredients(
    api_client, tmp_path
) -> None:
    files = write_files(
        tmp_path,
        [{"id": 1, "korean_name": "쌀"}, {"id": 2, "korean_name": "우유"}],
        [judged(1, "ALLERGY.EGGS"), judged(2, "ALLERGY.EGGS", "ALWAYS")],
    )

    async def stranger(session):
        session.add(Ingredient(id=50, korean_name="목록 밖 재료"))
        await session.flush()
        session.add(
            IngredientRestriction(
                ingredient_id=50, restriction_type=EGGS, degree=RestrictionDegree.ALWAYS
            )
        )

    await with_session(stranger)

    async def load(session):
        return await import_catalog(session, *files)

    first = await with_session(load)
    again = await with_session(load)
    assert (first.ingredients, first.restrictions) == (2, 2) and again == first

    # 이름이 바뀌고 판정이 달라진 파일을 다시 적재한다.
    files = write_files(
        tmp_path,
        [{"id": 1, "korean_name": "흰쌀"}, {"id": 2, "korean_name": "우유"}],
        [judged(1, "ALLERGY.EGGS"), judged(1, "VEGETARIAN.DAIRY")],
    )
    await with_session(load)

    async def read(session):
        names = dict((await session.execute(select(Ingredient.id, Ingredient.korean_name))).all())
        pairs = sorted(
            (row.ingredient_id, row.restriction_type.value, row.degree.value)
            for row in (await session.scalars(select(IngredientRestriction))).all()
        )
        return names, pairs

    names, pairs = await with_session(read)
    assert names == {1: "흰쌀", 2: "우유", 50: "목록 밖 재료"}
    assert pairs == [
        (1, "ALLERGY.EGGS", "NEVER"),
        (1, "VEGETARIAN.DAIRY", "NEVER"),
        (50, "ALLERGY.EGGS", "ALWAYS"),  # 파일에 없는 재료의 판정은 그대로 둔다
    ]


@pytest.mark.parametrize(
    "ingredients,restrictions",
    [
        ([{"id": 1, "korean_name": "쌀"}], [judged(1, "ALLERGY.UNKNOWN")]),
        ([{"id": 1, "korean_name": "쌀"}], [judged(1, "ALLERGY.EGGS", "SOMETIMES")]),
        ([{"id": 1, "korean_name": "쌀"}], [judged(1, "ALLERGY.NONE")]),
        ([{"id": 1, "korean_name": "쌀"}], [judged(9, "ALLERGY.EGGS")]),
        ([{"id": 1, "korean_name": "쌀"}], [judged(1, "ALLERGY.EGGS"), judged(1, "ALLERGY.EGGS")]),
        ([{"id": 1, "korean_name": "쌀"}, {"id": 1, "korean_name": "밥"}], []),
        ([{"id": 1, "korean_name": " "}], []),
    ],
    ids=[
        "unknown-type",
        "unknown-degree",
        "allergy-none",
        "orphan",
        "duplicate",
        "dup-id",
        "blank",
    ],
)
async def test_import_rejects_invalid_files_without_writing(
    api_client, tmp_path, ingredients, restrictions
) -> None:
    files = write_files(tmp_path, ingredients, restrictions)

    async def load(session):
        return await import_catalog(session, *files)

    with pytest.raises(ValueError):
        await with_session(load)

    async def count(session):
        return len((await session.scalars(select(Ingredient))).all())

    assert await with_session(count) == 0


def test_the_raw_asset_files_match_the_current_enums() -> None:
    names, judgements = validate(
        read_jsonl(ASSETS / "ingredients.jsonl"),
        read_jsonl(ASSETS / "ingredients_restrictions.jsonl"),
    )
    assert len(names) == 1613 and len(judgements) == 18711
