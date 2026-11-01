# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: HTTP 테스트 fixture 이름을 api_client로 명확화
"""Shared ingredient catalog and name-based recovery."""

from pathlib import Path
from runpy import run_path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from httpx import AsyncClient
from sqlalchemy import create_engine, text

from app.core.database import get_session
from app.main import app
from app.models.ingredient import Ingredient
from tests.helpers.auth import auth_headers


def test_mock_catalog_migration_seeds_stable_ids() -> None:
    migration_path = (
        Path(__file__).resolve().parents[2]
        / "migrations/versions/20261021_1300_mock_ingredients.py"
    )
    migration = run_path(str(migration_path))
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            migration["upgrade"]()
        rows = connection.execute(text("SELECT id, name FROM ingredients ORDER BY id")).all()
        assert rows[:2] == [(182, "당근"), (212, "감자")]
        assert len(rows) == 8
        with Operations.context(context):
            migration["downgrade"]()
    engine.dispose()


async def seed_catalog() -> None:
    async for session in app.dependency_overrides[get_session]():
        session.add_all([Ingredient(id=182, name="당근"), Ingredient(id=212, name="감자")])


@pytest.mark.asyncio
async def test_shared_catalog_and_name_fallback(api_client: AsyncClient) -> None:
    await seed_catalog()
    assert (await api_client.get("/api/v1/ingredients")).status_code == 401
    headers = await auth_headers(api_client, "first@example.com")
    other_headers = await auth_headers(api_client, "second@example.com")
    expected = [{"id": "182", "name": "당근"}, {"id": "212", "name": "감자"}]
    assert (await api_client.get("/api/v1/ingredients", headers=headers)).json() == expected
    assert (await api_client.get("/api/v1/ingredients", headers=other_headers)).json() == expected

    for ingredient_id in ("212", None, "999", "182", "bad-id", "9" * 5000):
        response = await api_client.post(
            "/api/v1/ingredients/resolve",
            headers=headers,
            json={"id": ingredient_id, "name": "  감자  "},
        )
        assert response.status_code == 200, response.text
        assert response.json() == {"id": "212", "name": "감자"}


@pytest.mark.asyncio
async def test_unknown_or_blank_ingredient_name_is_rejected(api_client: AsyncClient) -> None:
    await seed_catalog()
    headers = await auth_headers(api_client, "parent@example.com")
    unknown = await api_client.post(
        "/api/v1/ingredients/resolve",
        headers=headers,
        json={"id": "212", "name": "없는 재료"},
    )
    assert unknown.status_code == 404
    assert unknown.json()["error_code"] == "INGREDIENT_NOT_FOUND"
    blank = await api_client.post(
        "/api/v1/ingredients/resolve",
        headers=headers,
        json={"id": None, "name": "   "},
    )
    assert blank.status_code == 422
