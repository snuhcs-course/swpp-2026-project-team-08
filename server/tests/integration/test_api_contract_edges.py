# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Register separate check-in ingredient storage in the schema contract
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 테이블 목록과 식사 저장·리뷰 헬퍼를 새 ORM·식사 계약으로 변경
"""Contract edge cases for authenticated meals, reviews, and suggestions."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import Base, get_session
from app.core.timezone import now_kst
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.main import app
from app.models import Ingredient
from tests.helpers.auth import auth_headers as login
from tests.helpers.suggestions import batch, install_model


def test_only_current_tables_and_routes_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "ingredients",
        "ingredient_restrictions",
        "meals",
        "meal_foods",
        "meal_food_ingredients",
        "food_recommendations",
        "food_recommendation_tries",
        "users",
        "user_email_change_attempts",
        "user_profiles",
        "user_profile_safe_foods",
        "user_consents",
    }
    assert not any(path.startswith("/api/v1/children/") for path in app.openapi()["paths"])


async def save_meal(
    client: AsyncClient,
    headers: dict[str, str],
    meal_date: str,
    *,
    ingredient: bool = False,
) -> str:
    response = await client.put(
        "/api/v1/meals",
        headers=headers,
        json={
            "meal_date": meal_date,
            "meal_type": "LUNCH",
            "setting": "HOME",
            "before_photo_uri": "before.jpg",
            "foods": [
                {
                    "name": "감자",
                    "ingredients": [{"name": "감자"}] if ingredient else [],
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
    food_id: str | None = None,
    outcome: str = "EATEN",
) -> object:
    if food_id is None:
        # 음식 id 는 서버가 발급하므로 저장된 식사에서 찾는다. 남의 식사면 404 가 그대로 돌아온다.
        detail = await client.get(f"/api/v1/meals/{meal_id}", headers=headers)
        if detail.status_code != 200:
            return detail
        food_id = detail.json()["foods"][0]["id"]
    return await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json={
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": food_id,
                    "outcome": outcome,
                    "difficulty_reasons": [],
                    "ingredient_outcomes": [],
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
    first = await review_meal(client, owner, older, outcome="EATEN")
    assert first.status_code == 200, first.text
    replaced = await review_meal(client, owner, older, outcome="TASTED")
    assert replaced.status_code == 200, replaced.text
    detail = (await client.get(f"/api/v1/meals/{older}", headers=owner)).json()
    assert detail["before_photo_uri"] == "before.jpg"
    assert detail["after_photo_uri"] == "after.jpg"
    assert [food["outcome"] for food in detail["foods"]] == ["TASTED"]
    assert "review" not in detail


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

    model = install_model(monkeypatch, [batch()] * MAX_ATTEMPTS)
    failed = await client.post(path, headers=owner, json={"targets": [target]})
    assert failed.status_code == 502
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert (await client.get(f"{path}?status=all", headers=owner)).json() == []
    install_model(monkeypatch, [batch("0")])
    retried = await client.post(path, headers=owner, json={"targets": [target]})
    assert retried.status_code == 201, retried.text
    assert len((await client.get(f"{path}?status=all", headers=owner)).json()) == 1


@pytest.mark.asyncio
async def test_saved_filter_decision_validation_and_undo(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    meal_id = await save_meal(client, owner, "2026-10-20")
    assert (await review_meal(client, owner, meal_id)).status_code == 200

    install_model(monkeypatch, [batch("0")])
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
