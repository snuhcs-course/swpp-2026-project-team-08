# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Verify isolated check-in ingredients and atomic meal writes
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
from app.models import (
    Ingredient,
    Meal,
    MealFoodIngredient,
    MealIngredient,
    SuggestionMealLink,
    UserSuggestion,
)
from tests.helpers.auth import auth_headers


def test_meal_migration_keeps_legacy_food_rows() -> None:
    migration = run_path(
        str(
            Path(__file__).resolve().parents[2]
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
@pytest.mark.parametrize("seeded", [False, True])
async def test_write_meal_saves_free_text_ingredients(client: AsyncClient, seeded: bool) -> None:
    if seeded:
        await seed_ingredients()
    headers = await auth_headers(client, "meal@example.com")
    response = await client.put(
        "/api/v1/meals", headers=headers, json=meal_payload(None, "우리집 양념")
    )
    assert response.status_code == 200, response.text
    meal_id = response.json()["id"]
    detail = await client.get(f"/api/v1/meals/{meal_id}", headers=headers)
    ingredient = detail.json()["foods"][0]["ingredients"][0]
    assert ingredient["name"] == "우리집 양념"
    assert 0 < int(ingredient["id"]) < 2**63

    async for session in app.dependency_overrides[get_session]():
        assert await session.get(MealIngredient, int(ingredient["id"])) is not None
        assert await session.get(Ingredient, int(ingredient["id"])) is None
    catalog = await client.get("/api/v1/ingredients", headers=headers)
    assert all(item["name"] != ingredient["name"] for item in catalog.json())
    resolved = await client.post(
        "/api/v1/ingredients/resolve",
        headers=headers,
        json={"id": ingredient["id"], "name": ingredient["name"]},
    )
    assert resolved.status_code == 404

    edited = {"foods": meal_payload(None, "Another custom ingredient")["foods"]}
    update = await client.put(f"/api/v1/meals/{meal_id}/foods", headers=headers, json=edited)
    assert update.status_code == 200, update.text
    assert update.json()["foods"][0]["ingredients"][0]["name"] == "Another custom ingredient"

    repeated = await client.put(
        "/api/v1/meals", headers=headers, json=meal_payload(None, "  우리집   양념  ")
    )
    assert repeated.status_code == 200, repeated.text
    detail = await client.get(f"/api/v1/meals/{repeated.json()['id']}", headers=headers)
    assert detail.json()["foods"][0]["ingredients"] == [ingredient]


@pytest.mark.asyncio
@pytest.mark.parametrize("invalid_link", [False, True])
async def test_invalid_free_text_meal_rolls_back_new_ingredients(
    client: AsyncClient, invalid_link: bool
) -> None:
    headers = await auth_headers(client, "rollback@example.com")
    payload = meal_payload(None, "Custom spice")
    if invalid_link:
        payload["suggestion_links"] = [
            {"suggestion_id": "301", "food_id": "1", "ingredient_id": None}
        ]
    else:
        payload["foods"][0]["ingredients"].append({"id": None, "name": " custom   SPICE "})
    response = await client.put("/api/v1/meals", headers=headers, json=payload)
    assert response.status_code == 422, response.text
    expected_error = "INVALID_MEAL_LINK" if invalid_link else "DUPLICATE_INGREDIENT"
    assert response.json()["error_code"] == expected_error
    async for session in app.dependency_overrides[get_session]():
        assert (await session.scalars(select(Meal))).all() == []
        assert (await session.scalars(select(Ingredient))).all() == []
        assert (await session.scalars(select(MealIngredient))).all() == []


@pytest.mark.asyncio
async def test_invalid_food_edit_preserves_the_meal_and_catalog(client: AsyncClient) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "edit-rollback@example.com")
    saved = await client.put("/api/v1/meals", headers=headers, json=meal_payload())
    meal_id = saved.json()["id"]
    edited = meal_payload(None, "Custom spice")["foods"]
    edited[0]["ingredients"].append({"id": None, "name": "custom SPICE"})
    rejected = await client.put(
        f"/api/v1/meals/{meal_id}/foods", headers=headers, json={"foods": edited}
    )
    assert rejected.status_code == 422, rejected.text
    assert rejected.json()["error_code"] == "DUPLICATE_INGREDIENT"
    detail = await client.get(f"/api/v1/meals/{meal_id}", headers=headers)
    assert detail.json()["foods"][0]["ingredients"] == [{"id": "212", "name": "감자"}]
    catalog = await client.get("/api/v1/ingredients", headers=headers)
    assert len(catalog.json()) == 2


@pytest.mark.asyncio
async def test_write_meal_rejects_invalid_links_and_duplicate_ingredients(
    client: AsyncClient,
) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "meal@example.com")
    linked = meal_payload()
    linked["suggestion_links"] = [{"suggestion_id": "301", "food_id": "1", "ingredient_id": None}]
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


@pytest.mark.asyncio
async def test_update_meal_foods_preserves_valid_links_and_rejects_reviewed_meal(
    client: AsyncClient,
) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "edit@example.com")
    saved = await client.put("/api/v1/meals", headers=headers, json=meal_payload())
    assert saved.status_code == 200
    meal_id = saved.json()["id"]
    edited = {
        "foods": [
            {
                **meal_payload()["foods"][0],
                "name": "감자와 당근",
                "ingredients": [
                    {"id": "212", "name": "감자"},
                    {"id": "182", "name": "당근"},
                ],
            },
            {"id": "2", "name": "당근", "ingredients": [{"id": "182", "name": "당근"}]},
        ]
    }
    response = await client.put(f"/api/v1/meals/{meal_id}/foods", headers=headers, json=edited)
    assert response.status_code == 200, response.text
    assert [food["name"] for food in response.json()["foods"]] == ["감자와 당근", "당근"]
    assert len(response.json()["foods"][0]["ingredients"]) == 2
    review = await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json={
            "after_photo_uri": None,
            "food_results": [
                {"food_id": "1", "outcome": "eaten", "difficulties": [], "ingredient_outcomes": []},
                {"food_id": "2", "outcome": "eaten", "difficulties": [], "ingredient_outcomes": []},
            ],
        },
    )
    assert review.status_code == 200, review.text
    rejected = await client.put(f"/api/v1/meals/{meal_id}/foods", headers=headers, json=edited)
    assert rejected.status_code == 409
    assert rejected.json()["error_code"] == "MEAL_ALREADY_REVIEWED"


@pytest.mark.asyncio
async def test_update_foods_removes_only_invalid_suggestion_links(client: AsyncClient) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "links-edit@example.com")
    async for session in app.dependency_overrides[get_session]():
        session.add_all(
            [
                UserSuggestion(
                    id=301,
                    user_id=1,
                    meal_id=1,
                    food_id=1,
                    food_snapshot={},
                    what_to_try="감자",
                    why_this_may_help="이유",
                    status="saved",
                    saved_at=datetime.now(UTC),
                ),
                UserSuggestion(
                    id=302,
                    user_id=1,
                    meal_id=1,
                    food_id=1,
                    food_snapshot={},
                    what_to_try="식사",
                    why_this_may_help="이유",
                    status="saved",
                    saved_at=datetime.now(UTC),
                ),
            ]
        )
    payload = meal_payload()
    payload["suggestion_links"] = [
        {"suggestion_id": "301", "food_id": "1", "ingredient_id": "212"},
        {"suggestion_id": "302", "food_id": "1", "ingredient_id": None},
    ]
    saved = await client.put("/api/v1/meals", headers=headers, json=payload)
    assert saved.status_code == 200, saved.text
    meal_id = saved.json()["id"]
    edited = {"foods": [{**payload["foods"][0], "ingredients": [{"id": "182", "name": "당근"}]}]}
    response = await client.put(f"/api/v1/meals/{meal_id}/foods", headers=headers, json=edited)
    assert response.status_code == 200, response.text
    assert [link["suggestion_id"] for link in response.json()["suggestion_links"]] == ["302"]


@pytest.mark.asyncio
async def test_update_foods_deletes_omitted_food(client: AsyncClient) -> None:
    await seed_ingredients()
    headers = await auth_headers(client, "delete-food@example.com")
    payload = meal_payload()
    payload["foods"].append(
        {
            "id": "2",
            "name": "당근",
            "ingredients": [{"id": "182", "name": "당근"}],
        }
    )
    saved = await client.put("/api/v1/meals", headers=headers, json=payload)
    assert saved.status_code == 200, saved.text
    meal_id = saved.json()["id"]
    response = await client.put(
        f"/api/v1/meals/{meal_id}/foods",
        headers=headers,
        json={"foods": [payload["foods"][0]]},
    )
    assert response.status_code == 200, response.text
    assert [food["id"] for food in response.json()["foods"]] == ["1"]


@pytest.mark.asyncio
@pytest.mark.parametrize("ingredient_name", ["", " \t\n"])
async def test_blank_ingredient_update_preserves_existing_meal(client, ingredient_name):
    await seed_ingredients()
    headers = await auth_headers(client, "recover@example.com")
    saved = await client.put("/api/v1/meals", headers=headers, json=meal_payload())
    assert saved.status_code == 200
    url = f"/api/v1/meals/{saved.json()['id']}"
    before = (await client.get(url, headers=headers)).json()
    invalid = meal_payload(ingredient_name=ingredient_name)
    invalid["foods"][0]["name"] = "Must not persist"
    rejected = await client.put(f"{url}/foods", headers=headers, json={"foods": invalid["foods"]})
    assert rejected.status_code == 422
    assert rejected.json()["error_code"] == "VALIDATION_ERROR"
    assert (await client.get(url, headers=headers)).json() == before


@pytest.mark.asyncio
async def test_invalid_replacement_review_preserves_previous_review(client):
    await seed_ingredients()
    headers = await auth_headers(client, "review-recover@example.com")
    saved = await client.put("/api/v1/meals", headers=headers, json=meal_payload())
    assert saved.status_code == 200
    url = f"/api/v1/meals/{saved.json()['id']}"
    review = {
        "after_photo_uri": None,
        "food_results": [
            {"food_id": "1", "outcome": "eaten", "difficulties": [], "ingredient_outcomes": []}
        ],
    }
    written = await client.put(f"{url}/review", headers=headers, json=review)
    assert written.status_code == 200
    before = (await client.get(url, headers=headers)).json()
    review["food_results"][0]["food_id"] = "999"
    rejected = await client.put(f"{url}/review", headers=headers, json=review)
    assert rejected.status_code == 422
    assert (await client.get(url, headers=headers)).json() == before
