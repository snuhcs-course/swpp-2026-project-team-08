# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 카탈로그 쿼리와 재료·제한 판정 적재 스크립트 검증 추가
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

# AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung
# Changed: 통합 CLI의 재료 교체·기록 보존과 서버 계약·원본 집계 검증

"""영어 재료 파일, 카탈로그 조회, 추천 API를 실제 SQLite로 검증한다."""

import asyncio
import json
from pathlib import Path

import pytest
from langchain_core.messages import HumanMessage
from sqlalchemy import select

from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.ingredients import ChildRestrictions
from app.models import Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType
from scripts.ingredient_catalog import cli
from scripts.ingredient_catalog import load as load_ingredients
from scripts.ingredient_catalog.load import read_catalog as read_catalog_files
from tests.fixtures.meals import food_payload, meal_payload
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model, save_profile, seed_ingredient

NEVER = RestrictionDegree.NEVER
EGGS = RestrictionType.ALLERGY_EGGS
DAIRY = RestrictionType.VEGETARIAN_DAIRY
RESULT = Path(__file__).resolve().parents[3] / "data" / "ingredient_db" / "result"


@pytest.fixture
def run_catalog_cli(session_factory, monkeypatch):
    monkeypatch.setattr("app.core.database.AsyncSessionLocal", session_factory)

    async def run(command, files=None):
        arguments = [command] if command is not None else []
        if files is not None:
            arguments.extend(["--ingredients", str(files[0]), "--restrictions", str(files[1])])
        await asyncio.to_thread(cli.main, arguments)

    return run


async def seed(session) -> None:
    rows = {
        "Rice": {EGGS: NEVER, DAIRY: NEVER},
        "Milk": {EGGS: NEVER, DAIRY: RestrictionDegree.ALWAYS},
        "Bread": {EGGS: RestrictionDegree.DEPENDS_ON_PRODUCT, DAIRY: NEVER},
        "Carrot": {EGGS: NEVER},
        "Unreviewed": {},
    }
    for name, judgements in rows.items():
        ingredient = Ingredient(english_name=name, korean_name="쌀" if name == "Rice" else None)
        session.add(ingredient)
        await session.flush()
        session.add_all(
            IngredientRestriction(ingredient_id=ingredient.id, restriction_type=kind, degree=degree)
            for kind, degree in judgements.items()
        )
    session.add_all(
        [
            Ingredient(korean_name="한국어 이름만 있음"),
            Ingredient(english_name="  "),
        ]
    )


async def names_for(session_factory, *types: RestrictionType) -> set[str]:
    async with session_factory() as session:
        catalog = await load_catalog(session, ChildRestrictions(frozenset(types)))
        return set(catalog.names.values())


async def test_모든_제한에_NEVER_판정이_있어야_추천한다(session_factory) -> None:
    async with session_factory.begin() as session:
        await seed(session)

    assert await names_for(session_factory, EGGS, DAIRY) == {"Rice"}
    assert await names_for(session_factory, EGGS) == {"Rice", "Milk", "Carrot"}
    assert await names_for(session_factory, DAIRY) == {"Rice", "Bread"}


async def test_영어를_우선하고_적재_전_한국어_목록도_읽되_빈_이름은_제외한다(
    session_factory,
) -> None:
    async with session_factory.begin() as session:
        await seed(session)

    assert await names_for(session_factory) == {
        "Rice",
        "Milk",
        "Bread",
        "Carrot",
        "Unreviewed",
        "한국어 이름만 있음",
    }


async def test_미판정_제한이_있으면_추천하지_않는다(session_factory) -> None:
    async with session_factory.begin() as session:
        await seed(session)

    assert await names_for(session_factory, RestrictionType.ALLERGY_PEANUTS) == set()


def write_files(tmp_path: Path, ingredients: list[dict], restrictions: list[dict]):
    first, second = tmp_path / "ingredients.jsonl", tmp_path / "restrictions.jsonl"
    first.write_text("\n".join(json.dumps(row) for row in ingredients), encoding="utf-8")
    second.write_text("\n".join(json.dumps(row) for row in restrictions), encoding="utf-8")
    return first, second


def ingredient(ingredient_id: int, name: str) -> dict:
    return {"id": ingredient_id, "korean_name": None, "english_name": name}


def judged(ingredient_id: int, kind: str, degree: str = "NEVER") -> dict:
    return {"ingredient_id": ingredient_id, "restriction_type": kind, "degree": degree}


async def read_catalog(session_factory):
    async with session_factory() as session:
        names = list(
            (
                await session.execute(
                    select(Ingredient.id, Ingredient.korean_name, Ingredient.english_name).order_by(
                        Ingredient.id
                    )
                )
            ).all()
        )
        pairs = sorted(
            (row.ingredient_id, row.restriction_type.value, row.degree.value)
            for row in (await session.scalars(select(IngredientRestriction))).all()
        )
        return names, pairs


async def test_반복_교체와_ID_재사용은_이전_카탈로그와_판정을_남기지_않는다(
    session_factory, tmp_path, run_catalog_cli, capsys
) -> None:
    async with session_factory.begin() as session:
        session.add_all(
            [
                Ingredient(id=1, korean_name="예전 이름"),
                Ingredient(id=50, english_name="Old ingredient"),
            ]
        )
        await session.flush()
        session.add(
            IngredientRestriction(
                ingredient_id=50, restriction_type=EGGS, degree=RestrictionDegree.ALWAYS
            )
        )
    files = write_files(
        tmp_path,
        [ingredient(1, "Rice"), ingredient(2, "Milk")],
        [judged(1, "ALLERGY.EGGS"), judged(2, "ALLERGY.EGGS", "ALWAYS")],
    )
    for _ in range(2):
        await run_catalog_cli("replace", files)
        assert "재료 2개, 제한 판정 2개" in capsys.readouterr().out
    assert await read_catalog(session_factory) == (
        [(1, None, "Rice"), (2, None, "Milk")],
        [(1, "ALLERGY.EGGS", "NEVER"), (2, "ALLERGY.EGGS", "ALWAYS")],
    )

    files = write_files(tmp_path, [ingredient(1, "Brown rice")], [])
    await run_catalog_cli("replace", files)
    assert await read_catalog(session_factory) == ([(1, None, "Brown rice")], [])


async def test_CLI_명령을_선택하지_않으면_DB를_바꾸지_않는다(
    session_factory, run_catalog_cli
) -> None:
    async with session_factory.begin() as session:
        await seed(session)
    before = await read_catalog(session_factory)
    with pytest.raises(SystemExit) as raised:
        await run_catalog_cli(None)
    assert raised.value.code == 2
    assert await read_catalog(session_factory) == before


async def test_파일_검증_실패는_기존_카탈로그를_보존한다(
    session_factory, tmp_path, run_catalog_cli
) -> None:
    files = write_files(tmp_path, [ingredient(1, "Rice")], [judged(9, "ALLERGY.EGGS")])
    async with session_factory.begin() as session:
        await seed(session)
    before = await read_catalog(session_factory)
    with pytest.raises(ValueError, match="unknown ingredient id"):
        await run_catalog_cli("replace", files)
    assert await read_catalog(session_factory) == before


async def test_삭제_후_저장_실패도_기존_카탈로그를_복구한다(
    session_factory, tmp_path, monkeypatch, run_catalog_cli
) -> None:
    files = write_files(tmp_path, [ingredient(1, "Rice")], [judged(1, "ALLERGY.EGGS")])
    async with session_factory.begin() as session:
        await seed(session)
    before = await read_catalog(session_factory)

    async def fail_after_insert(session):
        raise RuntimeError("injected write failure")

    monkeypatch.setattr(load_ingredients, "sync_ingredient_sequence", fail_after_insert)
    with pytest.raises(RuntimeError, match="injected write failure"):
        await run_catalog_cli("replace", files)
    assert await read_catalog(session_factory) == before


async def test_영어_재료로_추천하고_교체_후에도_식사와_저장_추천을_보존한다(
    api_client, session_factory, monkeypatch, tmp_path, run_catalog_cli
) -> None:
    owner = await auth_headers(api_client, "catalog@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    model = install_model(monkeypatch, [batch("0")])
    saved = await api_client.put(
        "/api/v1/meals", headers=owner, json=meal_payload(food_payload("Rice bowl", "Rice"))
    )
    assert saved.status_code == 200
    meal = saved.json()
    meal_path = f"/api/v1/meals/{meal['id']}"
    reviewed = await api_client.put(
        meal_path + "/review",
        headers=owner,
        json={"food_results": [{"food_id": meal["foods"][0]["id"], "outcome": "TASTED"}]},
    )
    assert reviewed.status_code == 200
    generated = await api_client.post(
        meal_path + "/suggestions",
        headers=owner,
        json={"targets": [{"food_id": meal["foods"][0]["id"]}]},
    )
    assert generated.status_code == 201, generated.text
    recommendation = generated.json()[0]
    assert recommendation["ingredients"] == ["Rice"]
    prompt = next(m.content for m in model.compose_inputs[0] if isinstance(m, HumanMessage))
    assert prompt.split("쓸 수 있는 재료 (한 줄에 하나):\n")[1] == "Rice"
    decision = await api_client.put(
        f"/api/v1/suggestions/{recommendation['id']}/decision",
        headers=owner,
        json={"status": "SAVED", "dismiss_reasons": []},
    )
    assert decision.status_code == 200
    before_meal = (await api_client.get(meal_path, headers=owner)).json()
    before_recommendations = (await api_client.get("/api/v1/suggestions", headers=owner)).json()

    files = write_files(tmp_path, [ingredient(1, "Broccoli")], [])
    await run_catalog_cli("replace", files)

    assert (await api_client.get(meal_path, headers=owner)).json() == before_meal
    assert (
        await api_client.get("/api/v1/suggestions", headers=owner)
    ).json() == before_recommendations
    assert await names_for(session_factory) == {"Broccoli"}


def test_최종_파일이_서버_계약과_검토_집계를_만족한다() -> None:
    catalog = read_catalog_files(
        RESULT / "ingredients.jsonl",
        RESULT / "ingredients_restrictions.jsonl",
    )
    summary = json.loads((RESULT.parent / "review" / "summary.json").read_text(encoding="utf-8"))
    assert len(catalog.names) == summary["ingredients"]
    assert len(catalog.judgements) == summary["restrictions"]
    assert summary["restriction_types"] == len(RestrictionType) - 1
    assert len(catalog.judgements) + summary["unresolved_restrictions"] == len(catalog.names) * (
        len(RestrictionType) - 1
    )
