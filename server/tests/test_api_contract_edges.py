"""Contract edge cases for authenticated meals, reviews, and suggestions."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import Base, get_session
from app.core.timezone import now_kst
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from app.main import app
from app.models import Ingredient


def test_only_current_tables_and_routes_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "ingredients",
        "meals",
        "meal_foods",
        "meal_food_ingredients",
        "review_food_results",
        "review_ingredient_results",
        "suggestions",
        "suggestion_meal_links",
        "users",
        "user_profiles",
        "user_profile_choices",
        "safe_foods",
        "user_consents",
    }
    assert not any(path.startswith("/api/v1/children/") for path in app.openapi()["paths"])


async def login(client: AsyncClient, email: str) -> dict[str, str]:
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "supersecret", "full_name": "보호자"},
    )
    assert signup.status_code == 201
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "supersecret"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def save_meal(
    client: AsyncClient,
    headers: dict[str, str],
    meal_date: str,
    *,
    food_id: str = "1",
    ingredient: bool = False,
) -> str:
    response = await client.put(
        "/api/v1/meals",
        headers=headers,
        json={
            "meal_date": meal_date,
            "meal_type": "lunch",
            "setting": "home",
            "before_photo_uri": "before.jpg",
            "foods": [
                {
                    "id": food_id,
                    "name": "감자",
                    "ingredients": [{"id": "212", "name": "감자"}] if ingredient else [],
                }
            ],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["id"]


async def review_meal(
    client: AsyncClient,
    headers: dict[str, str],
    meal_id: str,
    *,
    food_id: str = "1",
    ingredient_id: str | None = None,
    outcome: str | None = None,
) -> object:
    return await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json={
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": food_id,
                    "outcome": outcome,
                    "difficulties": [],
                    "ingredient_outcomes": []
                    if ingredient_id is None
                    else [
                        {
                            "ingredient_id": ingredient_id,
                            "outcome": "tasted",
                            "difficulties": [],
                        }
                    ],
                }
            ],
        },
    )


@pytest.mark.asyncio
async def test_meal_history_review_replacement_and_ownership(client: AsyncClient) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    older = await save_meal(client, owner, "2026-10-19")
    newer = await save_meal(client, owner, "2026-10-20")
    await save_meal(client, other, "2026-10-21")
    assert [row["id"] for row in (await client.get("/api/v1/meals", headers=owner)).json()] == [
        newer,
        older,
    ]
    assert (await client.get(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(client, other, older)).status_code == 404
    assert (await client.delete(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(client, owner, older, food_id="999")).status_code == 422
    first = await review_meal(client, owner, older, outcome="eaten")
    assert first.status_code == 200, first.text
    replaced = await review_meal(client, owner, older, outcome="tasted")
    assert replaced.status_code == 200, replaced.text
    detail = (await client.get(f"/api/v1/meals/{older}", headers=owner)).json()
    assert detail["before_photo_uri"] == "before.jpg"
    assert detail["after_photo_uri"] == "after.jpg"
    assert len(detail["review"]["food_results"]) == 1
    assert detail["review"]["food_results"][0]["outcome"] == "tasted"


@pytest.mark.asyncio
async def test_suggestion_target_validation_and_generation_failure_are_atomic(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async for session in app.dependency_overrides[get_session]():
        session.add(Ingredient(id=212, name="감자"))
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    meal_id = await save_meal(client, owner, "2026-10-20", ingredient=True)
    path = f"/api/v1/meals/{meal_id}/suggestions"
    target = {"food_id": "1", "ingredient_id": "212"}
    assert (await client.post(path, headers=owner, json={"targets": [target]})).status_code == 409
    assert (await review_meal(client, owner, meal_id, ingredient_id="212")).status_code == 200
    assert (await client.post(path, headers=other, json={"targets": [target]})).status_code == 404
    assert (await client.post(path, headers=owner, json={"targets": []})).status_code == 422
    assert (
        await client.post(path, headers=owner, json={"targets": [target, target]})
    ).status_code == 422
    assert (
        await client.post(
            path,
            headers=owner,
            json={"targets": [{"food_id": "1", "ingredient_id": "999"}]},
        )
    ).status_code == 422

    # AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
    async def invalid_generator(
        _: list[FoodInput], _restrictions: object, _child: object
    ) -> list[GeneratedSuggestion]:
        return []

    monkeypatch.setattr("app.features.suggestions.service.generate_suggestions", invalid_generator)
    failed = await client.post(path, headers=owner, json={"targets": [target]})
    assert failed.status_code == 502
    assert (await client.get(f"{path}?status=all", headers=owner)).json() == []


@pytest.mark.asyncio
async def test_saved_filter_decision_validation_and_undo(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    meal_id = await save_meal(client, owner, "2026-10-20")
    assert (await review_meal(client, owner, meal_id)).status_code == 200

    # AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
    async def generator(
        items: list[FoodInput], _restrictions: object, _child: object
    ) -> list[GeneratedSuggestion]:
        return [
            GeneratedSuggestion(
                food_id=item.id,
                what_to_try="소량 제공",
                why_this_may_help="익숙한 음식",
                serving_tip="작게 잘라 제공",
                used_ingredients=(),
            )
            for item in items
        ]

    monkeypatch.setattr("app.features.suggestions.service.generate_suggestions", generator)
    created = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={"targets": [{"food_id": "1", "ingredient_id": None}]},
    )
    assert created.status_code == 201, created.text
    suggestion_id = created.json()[0]["id"]
    decision = f"/api/v1/suggestions/{suggestion_id}/decision"
    assert (
        await client.put(
            decision,
            headers=owner,
            json={"status": "dismissed", "dismiss_reasons": []},
        )
    ).status_code == 422
    assert (
        await client.put(
            decision,
            headers=owner,
            json={"status": "saved", "dismiss_reasons": ["already_tried"]},
        )
    ).status_code == 422
    assert (
        await client.put(
            decision,
            headers=other,
            json={"status": "saved", "dismiss_reasons": []},
        )
    ).status_code == 404
    saved = await client.put(
        decision, headers=owner, json={"status": "saved", "dismiss_reasons": []}
    )
    assert saved.status_code == 200
    assert saved.json()["saved_at"] is not None
    yesterday = (now_kst().date() - timedelta(days=1)).isoformat()
    today = now_kst().date().isoformat()
    assert (
        len(
            (
                await client.get(
                    "/api/v1/suggestions",
                    headers=owner,
                    params={"after_meal_date": yesterday},
                )
            ).json()
        )
        == 1
    )
    assert (
        await client.get(
            "/api/v1/suggestions",
            headers=owner,
            params={"after_meal_date": today},
        )
    ).json() == []
    assert (await client.delete(decision, headers=owner)).json()["status"] == "pending"
    assert (await client.get("/api/v1/suggestions", headers=owner)).json() == []
