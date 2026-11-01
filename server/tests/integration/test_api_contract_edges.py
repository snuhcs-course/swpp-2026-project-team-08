# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Register separate check-in ingredient storage in the schema contract
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: api_client 이름 명확화 및 공통 리뷰 데이터 사용
"""Contract edge cases for authenticated meals, reviews, and suggestions."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import Base, get_session
from app.core.timezone import now_kst
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.main import app
from app.models import Ingredient
from tests.fixtures.reviews import review_payload
from tests.helpers.auth import auth_headers as login
from tests.helpers.suggestions import batch, install_model


def test_only_current_tables_and_routes_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "ingredients",
        "meal_ingredients",
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


async def save_meal(
    api_client: AsyncClient,
    headers: dict[str, str],
    meal_date: str,
    *,
    food_id: str = "1",
    ingredient: bool = False,
) -> str:
    response = await api_client.put(
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
    api_client: AsyncClient,
    headers: dict[str, str],
    meal_id: str,
    *,
    food_id: str = "1",
    ingredient_id: str | None = None,
    outcome: str | None = None,
) -> object:
    return await api_client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json=review_payload(food_id=food_id, ingredient_id=ingredient_id, outcome=outcome),
    )


@pytest.mark.asyncio
async def test_meal_history_review_replacement_and_ownership(api_client: AsyncClient) -> None:
    owner = await login(api_client, "owner@example.com")
    other = await login(api_client, "other@example.com")
    older = await save_meal(api_client, owner, "2026-10-19")
    newer = await save_meal(api_client, owner, "2026-10-20")
    await save_meal(api_client, other, "2026-10-21")
    assert [row["id"] for row in (await api_client.get("/api/v1/meals", headers=owner)).json()] == [
        newer,
        older,
    ]
    assert (await api_client.get(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(api_client, other, older)).status_code == 404
    assert (await api_client.delete(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(api_client, owner, older, food_id="999")).status_code == 422
    first = await review_meal(api_client, owner, older, outcome="eaten")
    assert first.status_code == 200, first.text
    replaced = await review_meal(api_client, owner, older, outcome="tasted")
    assert replaced.status_code == 200, replaced.text
    detail = (await api_client.get(f"/api/v1/meals/{older}", headers=owner)).json()
    assert detail["before_photo_uri"] == "before.jpg"
    assert detail["after_photo_uri"] == "after.jpg"
    assert len(detail["review"]["food_results"]) == 1
    assert detail["review"]["food_results"][0]["outcome"] == "tasted"


@pytest.mark.asyncio
async def test_suggestion_target_validation_and_generation_failure_are_atomic(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async for session in app.dependency_overrides[get_session]():
        session.add(Ingredient(id=212, name="감자"))
    owner = await login(api_client, "owner@example.com")
    other = await login(api_client, "other@example.com")
    meal_id = await save_meal(api_client, owner, "2026-10-20", ingredient=True)
    path = f"/api/v1/meals/{meal_id}/suggestions"
    target = {"food_id": "1", "ingredient_id": "212"}
    assert (
        await api_client.post(path, headers=owner, json={"targets": [target]})
    ).status_code == 409
    assert (await review_meal(api_client, owner, meal_id, ingredient_id="212")).status_code == 200
    assert (
        await api_client.post(path, headers=other, json={"targets": [target]})
    ).status_code == 404
    assert (await api_client.post(path, headers=owner, json={"targets": []})).status_code == 422
    assert (
        await api_client.post(path, headers=owner, json={"targets": [target, target]})
    ).status_code == 422
    assert (
        await api_client.post(
            path,
            headers=owner,
            json={"targets": [{"food_id": "1", "ingredient_id": "999"}]},
        )
    ).status_code == 422

    model = install_model(monkeypatch, [batch()] * MAX_ATTEMPTS)
    failed = await api_client.post(path, headers=owner, json={"targets": [target]})
    assert failed.status_code == 502
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert (await api_client.get(f"{path}?status=all", headers=owner)).json() == []
    install_model(monkeypatch, [batch("0")])
    retried = await api_client.post(path, headers=owner, json={"targets": [target]})
    assert retried.status_code == 201, retried.text
    assert len((await api_client.get(f"{path}?status=all", headers=owner)).json()) == 1


@pytest.mark.asyncio
async def test_saved_filter_decision_validation_and_undo(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(api_client, "owner@example.com")
    other = await login(api_client, "other@example.com")
    meal_id = await save_meal(api_client, owner, "2026-10-20")
    assert (await review_meal(api_client, owner, meal_id)).status_code == 200

    install_model(monkeypatch, [batch("0")])
    created = await api_client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={"targets": [{"food_id": "1", "ingredient_id": None}]},
    )
    assert created.status_code == 201, created.text
    suggestion_id = created.json()[0]["id"]
    decision = f"/api/v1/suggestions/{suggestion_id}/decision"
    assert (
        await api_client.put(
            decision,
            headers=owner,
            json={"status": "dismissed", "dismiss_reasons": []},
        )
    ).status_code == 422
    assert (
        await api_client.put(
            decision,
            headers=owner,
            json={"status": "saved", "dismiss_reasons": ["already_tried"]},
        )
    ).status_code == 422
    assert (
        await api_client.put(
            decision,
            headers=other,
            json={"status": "saved", "dismiss_reasons": []},
        )
    ).status_code == 404
    saved = await api_client.put(
        decision, headers=owner, json={"status": "saved", "dismiss_reasons": []}
    )
    assert saved.status_code == 200
    assert saved.json()["saved_at"] is not None
    yesterday = (now_kst().date() - timedelta(days=1)).isoformat()
    today = now_kst().date().isoformat()
    assert (
        len(
            (
                await api_client.get(
                    "/api/v1/suggestions",
                    headers=owner,
                    params={"after_meal_date": yesterday},
                )
            ).json()
        )
        == 1
    )
    assert (
        await api_client.get(
            "/api/v1/suggestions",
            headers=owner,
            params={"after_meal_date": today},
        )
    ).json() == []
    assert (await api_client.delete(decision, headers=owner)).json()["status"] == "pending"
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
