"""Authenticated meal write and ingredient ID resolution."""

from datetime import UTC, datetime
from pathlib import Path
from runpy import run_path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from httpx import AsyncClient
from sqlalchemy import create_engine, select, text

from app.core.database import get_session
from app.main import app
from app.models import Ingredient, Meal, MealFoodIngredient, SuggestionMealLink, UserSuggestion


def test_meal_migration_keeps_legacy_food_rows() -> None:
    migration = run_path(
        str(
            Path(__file__).resolve().parents[1]
            / "migrations/versions/20261021_1400_authenticated_meals.py"
        )
    )
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE meal_foods (meal_id TEXT, id TEXT)"))
        connection.execute(text("CREATE INDEX ix_meal_foods_meal_id ON meal_foods(meal_id)"))
        connection.execute(text("INSERT INTO meal_foods VALUES ('old-meal', 'old-food')"))
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            migration["upgrade"]()
        assert connection.execute(text("SELECT * FROM legacy_meal_foods")).all() == [
            ("old-meal", "old-food")
        ]
        with Operations.context(context):
            migration["downgrade"]()
        assert connection.execute(text("SELECT * FROM meal_foods")).all() == [
            ("old-meal", "old-food")
        ]
    engine.dispose()


async def auth_headers(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "supersecret", "full_name": "보호자"},
    )
    response = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "supersecret"}
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def seed_ingredients() -> None:
    async for session in app.dependency_overrides[get_session]():
        session.add_all([Ingredient(id=182, name="당근"), Ingredient(id=212, name="감자")])


def meal_payload(ingredient_id: str | None = None, ingredient_name: str = "감자") -> dict:
    return {
        "meal_date": "2026-10-20",
        "meal_type": "lunch",
        "setting": "home",
        "before_photo_uri": None,
        "foods": [
            {
                "id": "1",
                "name": "감자볶음",
                "ingredients": [{"id": ingredient_id, "name": ingredient_name}],
                "cooking_method": "stir_fried",
                "serving_note": "작게 잘라 제공",
                "acceptance": 1,
            }
        ],
        "suggestion_links": [],
    }


@pytest.mark.asyncio
async def test_write_meal_uses_authenticated_user_and_resolves_ingredient(
    client: AsyncClient,
) -> None:
    await seed_ingredients()
    assert (await client.put("/api/v1/meals", json=meal_payload())).status_code == 401
    headers = await auth_headers(client, "meal@example.com")
    response = await client.put(
        "/api/v1/meals", headers=headers, json=meal_payload(ingredient_id="999")
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["user_id"] == "1"
    assert body["id"].isdecimal()
    assert body["after_photo_uri"] is None
    assert body["saved_at"]
    async for session in app.dependency_overrides[get_session]():
        meal = await session.get(Meal, int(body["id"]))
        links = (
            await session.scalars(
                select(MealFoodIngredient).where(MealFoodIngredient.meal_id == int(body["id"]))
            )
        ).all()
        assert meal is not None and meal.user_id == 1
        assert len(links) == 1 and links[0].ingredient_id == 212


@pytest.mark.asyncio
async def test_write_meal_rejects_unknown_ingredient_without_saving(client: AsyncClient) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "meal@example.com")
    response = await client.put(
        "/api/v1/meals", headers=headers, json=meal_payload("212", "없는 재료")
    )
    assert response.status_code == 404
    assert response.json()["error_code"] == "INGREDIENT_NOT_FOUND"
    async for session in app.dependency_overrides[get_session]():
        assert (await session.scalars(select(Meal))).all() == []


@pytest.mark.asyncio
async def test_write_meal_rejects_invalid_links_and_duplicate_ingredients(
    client: AsyncClient,
) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "meal@example.com")
    linked = meal_payload()
    linked["suggestion_links"] = [
        {"suggestion_id": "301", "food_id": "1", "ingredient_id": None}
    ]
    response = await client.put("/api/v1/meals", headers=headers, json=linked)
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_MEAL_LINK"

    duplicated = meal_payload()
    duplicated["foods"][0]["ingredients"].append({"id": "212", "name": "감자"})
    response = await client.put("/api/v1/meals", headers=headers, json=duplicated)
    assert response.status_code == 422
    assert response.json()["error_code"] == "DUPLICATE_INGREDIENT"


@pytest.mark.asyncio
async def test_write_meal_links_saved_suggestion_to_selected_ingredient(
    client: AsyncClient,
) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "meal@example.com")
    async for session in app.dependency_overrides[get_session]():
        session.add(
            UserSuggestion(
                id=301,
                user_id=1,
                meal_id=1,
                food_id=1,
                food_snapshot={},
                what_to_try="감자 조리법 바꾸기",
                why_this_may_help="새로운 식감 제공",
                status="saved",
                saved_at=datetime.now(UTC),
            )
        )
    payload = meal_payload(ingredient_id="999")
    payload["suggestion_links"] = [
        {
            "suggestion_id": "301",
            "food_id": "1",
            "ingredient_id": "212",
        }
    ]
    response = await client.put("/api/v1/meals", headers=headers, json=payload)
    assert response.status_code == 200, response.text
    async for session in app.dependency_overrides[get_session]():
        links = (await session.scalars(select(SuggestionMealLink))).all()
        assert len(links) == 1
        assert links[0].meal_id == int(response.json()["id"])
        assert links[0].suggestion_id == 301
        assert links[0].ingredient_id == 212
