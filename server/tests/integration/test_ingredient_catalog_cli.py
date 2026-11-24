# AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung
# Changed: 통합 재료 CLI의 변경 감지·검증·단일 트랜잭션 롤백 검사

"""통합 명령의 DB 작업과 트랜잭션 경계를 실제 SQLite로 검증한다."""

import asyncio
import json

import pytest
from sqlalchemy import event, select
from sqlalchemy.orm import Session

from app.models import Ingredient, IngredientCatalogState, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from scripts.ingredient_catalog import cli
from scripts.ingredient_catalog.load import read_catalog


@pytest.fixture
def cli_database(session_factory, monkeypatch):
    monkeypatch.setattr("app.core.database.AsyncSessionLocal", session_factory)
    return session_factory


def write_catalog(tmp_path, name="Rice", degree="NEVER"):
    ingredients = tmp_path / "ingredients.jsonl"
    restrictions = tmp_path / "ingredients_restrictions.jsonl"
    ingredients.write_text(
        json.dumps({"id": 1, "korean_name": None, "english_name": name}) + "\n", encoding="utf-8"
    )
    restrictions.write_text(
        json.dumps({"ingredient_id": 1, "restriction_type": "ALLERGY.EGGS", "degree": degree})
        + "\n",
        encoding="utf-8",
    )
    return read_catalog(ingredients, restrictions)


async def snapshot(session_factory):
    async with session_factory() as session:
        names = (
            await session.execute(
                select(Ingredient.id, Ingredient.korean_name, Ingredient.english_name).order_by(
                    Ingredient.id
                )
            )
        ).all()
        judgements = (
            await session.execute(
                select(
                    IngredientRestriction.ingredient_id,
                    IngredientRestriction.restriction_type,
                    IngredientRestriction.degree,
                ).order_by(
                    IngredientRestriction.ingredient_id, IngredientRestriction.restriction_type
                )
            )
        ).all()
        state = await session.get(IngredientCatalogState, 1)
        return names, judgements, state.content_hash if state else None


async def test_apply는_처음_적재하고_파일이_바뀌면_재료와_판정과_해시를_함께_교체한다(
    tmp_path, cli_database
):
    original = write_catalog(tmp_path)
    await cli.run("apply", original)
    await cli.run("verify", original)
    assert (await snapshot(cli_database))[2] == original.content_hash

    changed = write_catalog(tmp_path, name="Milk", degree="ALWAYS")
    await cli.run("apply", changed)
    await cli.run("verify", changed)
    names, judgements, content_hash = await snapshot(cli_database)
    assert names == [(1, None, "Milk")]
    assert [(row.ingredient_id, row.degree) for row in judgements] == [
        (1, RestrictionDegree.ALWAYS)
    ]
    assert content_hash == changed.content_hash != original.content_hash


async def test_같은_파일의_apply는_DB를_유지하고_replace는_항상_교체한다(tmp_path, cli_database):
    catalog = write_catalog(tmp_path)
    await cli.run("apply", catalog)
    async with cli_database.begin() as session:
        ingredient = await session.get(Ingredient, 1)
        ingredient.english_name = "Manually edited rice"
    before = await snapshot(cli_database)

    await cli.run("apply", catalog)
    assert await snapshot(cli_database) == before

    await cli.run("replace", catalog)
    await cli.run("verify", catalog)
    names, _, content_hash = await snapshot(cli_database)
    assert names == [(1, None, "Rice")]
    assert content_hash == catalog.content_hash


@pytest.mark.parametrize("mismatch", ["name", "degree", "hash", "missing_state"])
async def test_verify는_행_수가_같아도_이름과_판정과_해시의_불일치를_거절한다(
    tmp_path, cli_database, mismatch
):
    catalog = write_catalog(tmp_path)
    await cli.run("apply", catalog)
    async with cli_database.begin() as session:
        if mismatch == "name":
            ingredient = await session.get(Ingredient, 1)
            ingredient.english_name = "Other rice"
        elif mismatch == "degree":
            judgement = await session.scalar(select(IngredientRestriction))
            judgement.degree = RestrictionDegree.ALWAYS
        else:
            state = await session.get(IngredientCatalogState, 1)
            if mismatch == "hash":
                state.content_hash = "0" * 64
            else:
                await session.delete(state)
    before = await snapshot(cli_database)

    with pytest.raises(ValueError, match="DB catalog does not match"):
        await cli.run("verify", catalog)
    assert await snapshot(cli_database) == before


@pytest.mark.parametrize("command", ["replace", "apply"])
async def test_최종_커밋_실패는_원래_데이터와_해시를_보존하고_성공을_출력하지_않는다(
    tmp_path, cli_database, capsys, command
):
    def fail_commit(session):
        raise RuntimeError("injected final commit failure")

    original = write_catalog(tmp_path)
    await cli.run("replace", original)
    before = await snapshot(cli_database)
    write_catalog(tmp_path, name="Milk", degree="ALWAYS")
    event.listen(Session, "before_commit", fail_commit)
    try:
        with pytest.raises(RuntimeError, match="injected final commit failure"):
            await asyncio.to_thread(
                cli.main,
                [
                    command,
                    "--ingredients",
                    str(tmp_path / "ingredients.jsonl"),
                    "--restrictions",
                    str(tmp_path / "ingredients_restrictions.jsonl"),
                ],
            )
    finally:
        event.remove(Session, "before_commit", fail_commit)
    assert capsys.readouterr().out == ""
    assert await snapshot(cli_database) == before
