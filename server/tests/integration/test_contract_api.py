# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Integration: 실제 API·서비스·SQLite 연결. LLM만 가짜 모델로 대체한다."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import get_session
from app.core.timezone import now_kst
from app.main import app
from app.models import Ingredient
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model


@pytest.mark.asyncio
async def test_meal_review_suggestion_and_history_flow(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async for session in app.dependency_overrides[get_session]():
        session.add_all([Ingredient(id=182, name="당근"), Ingredient(id=212, name="감자")])

    install_model(monkeypatch, [batch("0", "1")])
    owner = await auth_headers(client, "owner@example.com")
    stranger = await auth_headers(client, "stranger@example.com")
    saved = await client.put(
        "/api/v1/meals",
        headers=owner,
        json={
            "meal_date": "2026-10-20",
            "meal_type": "lunch",
            "setting": "home",
            "foods": [
                {
                    "id": "1",
                    "name": "당근 감자볶음",
                    "ingredients": [{"id": "182", "name": "당근"}, {"id": None, "name": "감자"}],
                    "cooking_method": "stir_fried",
                    "serving_note": None,
                    "acceptance": 1,
                }
            ],
        },
    )
    assert saved.status_code == 200, saved.text
    meal_id = saved.json()["id"]
    detail = await client.get(f"/api/v1/meals/{meal_id}", headers=owner)
    assert detail.status_code == 200, detail.text
    assert detail.json()["review"] is None
    assert detail.json()["foods"][0]["ingredients"] == [
        {"id": "182", "name": "당근"},
        {"id": "212", "name": "감자"},
    ]
    assert (await client.get(f"/api/v1/meals/{meal_id}", headers=stranger)).status_code == 404
    assert (await client.get("/api/v1/meals", headers=stranger)).json() == []
    unreviewed_generation = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={"targets": [{"food_id": "1", "ingredient_id": None}]},
    )
    assert unreviewed_generation.status_code == 409
    invalid_review = await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=owner,
        json={
            "food_results": [{"food_id": "1", "ingredient_outcomes": [{"ingredient_id": "999"}]}]
        },
    )
    assert invalid_review.status_code == 422

    review = await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=owner,
        json={
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": "1",
                    "outcome": None,
                    "difficulties": [],
                    "ingredient_outcomes": [
                        {
                            "ingredient_id": "182",
                            "outcome": "untouched",
                            "difficulties": [
                                {"category": "texture", "subcategory": "hardness", "value": "hard"}
                            ],
                        }
                    ],
                }
            ],
        },
    )
    assert review.status_code == 200, review.text
    assert review.json()["meal"]["after_photo_uri"] == "after.jpg"
    assert review.json()["food_results"][0]["food_snapshot"]["ingredients"][1]["id"] == "212"
    assert review.json()["ingredient_results"][0]["ingredient_id"] == "182"
    replaced = await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=owner,
        json={
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": "1",
                    "outcome": None,
                    "difficulties": [],
                    "ingredient_outcomes": [
                        {"ingredient_id": "182", "outcome": "untouched", "difficulties": []}
                    ],
                }
            ],
        },
    )
    assert replaced.status_code == 200, replaced.text
    assert len(replaced.json()["food_results"]) == 1
    assert len(replaced.json()["ingredient_results"]) == 1

    invalid = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={"targets": [{"food_id": "1", "ingredient_id": "212"}]},
    )
    assert invalid.status_code == 422
    generated = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={
            "targets": [
                {"food_id": "1", "ingredient_id": None},
                {"food_id": "1", "ingredient_id": "182"},
            ]
        },
    )
    assert generated.status_code == 201, generated.text
    assert [item["status"] for item in generated.json()] == ["pending", "pending"]
    first_id, second_id = [item["id"] for item in generated.json()]
    assert (await client.get(f"/api/v1/meals/{meal_id}/suggestions", headers=owner)).json() == []
    assert (
        len(
            (
                await client.get(f"/api/v1/meals/{meal_id}/suggestions?status=all", headers=owner)
            ).json()
        )
        == 2
    )

    saved_suggestion = await client.put(
        f"/api/v1/suggestions/{first_id}/decision",
        headers=owner,
        json={"status": "saved", "dismiss_reasons": []},
    )
    assert saved_suggestion.status_code == 200, saved_suggestion.text
    assert saved_suggestion.json()["saved_at"] is not None
    dismissed = await client.put(
        f"/api/v1/suggestions/{second_id}/decision",
        headers=owner,
        json={"status": "dismissed", "dismiss_reasons": ["too_much_preparation"]},
    )
    assert dismissed.status_code == 200
    assert dismissed.json()["saved_at"] is None
    assert (await client.get("/api/v1/suggestions", headers=owner)).json()[0]["id"] == first_id
    after_yesterday = (now_kst().date() - timedelta(days=1)).isoformat()
    after_today = now_kst().date().isoformat()
    assert (
        len(
            (
                await client.get(
                    f"/api/v1/suggestions?after_meal_date={after_yesterday}", headers=owner
                )
            ).json()
        )
        == 1
    )
    assert (
        await client.get(f"/api/v1/suggestions?after_meal_date={after_today}", headers=owner)
    ).json() == []
    assert (await client.delete(f"/api/v1/suggestions/{second_id}/decision", headers=owner)).json()[
        "status"
    ] == "pending"
    assert (
        await client.put(
            f"/api/v1/suggestions/{first_id}/decision",
            headers=stranger,
            json={"status": "dismissed", "dismiss_reasons": ["already_tried"]},
        )
    ).status_code == 404

    applied = await client.put(
        "/api/v1/meals",
        headers=owner,
        json={
            "meal_date": "2026-10-21",
            "meal_type": "dinner",
            "setting": "home",
            "foods": [{"id": "1", "name": "당근", "ingredients": [{"id": "182", "name": "당근"}]}],
            "suggestion_links": [
                {"suggestion_id": first_id, "food_id": "1", "ingredient_id": "182"}
            ],
        },
    )
    assert applied.status_code == 200, applied.text
    applied_id = applied.json()["id"]
    history = await client.get("/api/v1/meals", headers=owner)
    assert [item["id"] for item in history.json()] == [applied_id, meal_id]
    assert history.json()[0]["suggestion_links"][0]["suggestion"]["what_to_try"]
    assert history.json()[1]["review"]["ingredient_results"][0]["ingredient_id"] == "182"

    assert (await client.delete(f"/api/v1/meals/{meal_id}", headers=stranger)).status_code == 404
    assert (await client.delete(f"/api/v1/meals/{meal_id}", headers=owner)).status_code == 204
    assert (await client.get(f"/api/v1/meals/{meal_id}", headers=owner)).status_code == 404
    assert (await client.get("/api/v1/suggestions", headers=owner)).json()[0]["id"] == first_id
    linked_after_source_delete = await client.get(f"/api/v1/meals/{applied_id}", headers=owner)
    assert linked_after_source_delete.status_code == 200
    assert linked_after_source_delete.json()["suggestion_links"][0]["suggestion_id"] == first_id
