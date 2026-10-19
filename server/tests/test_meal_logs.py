# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""식사 기록 API 테스트."""

from datetime import UTC, datetime

# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import pytest
from httpx import AsyncClient

CHILD = "child-1"
OTHER = "child-2"
MEAL_ID = "meal-dinner-1"
FOOD_ID = "food-omelet"


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
@pytest.mark.parametrize("confirmed", [True, False])
async def test_food_confirmation_preserves_ai_provenance(client: AsyncClient, confirmed: bool):
    food = {**meal_payload()["foods"][0], "source": "ai", "confirmed": confirmed}
    saved = await put_meal(client, foods=[food])
    assert saved.status_code == 200, saved.text
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    assert detail.json()["foods"][0]["source"] == "ai"
    assert detail.json()["foods"][0]["confirmed"] is confirmed
    assert "origin" not in detail.json()["foods"][0]


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
@pytest.mark.parametrize("confirmed", [0, 1, "true", "false", None])
async def test_food_confirmation_rejects_non_booleans(client: AsyncClient, confirmed):
    food = {**meal_payload()["foods"][0], "confirmed": confirmed}
    result = await put_meal(client, foods=[food])
    assert result.status_code == 422


def meal_payload(**overrides: object) -> dict:
    body: dict = {
        "meal_date": "2026-10-09",
        "meal_type": "dinner",
        "setting": "home",
        "before_photo_uri": "file:///before.png",
        "saved_at": datetime(2026, 10, 9, 12, 0, tzinfo=UTC).isoformat(),
        "foods": [
            {
                "id": FOOD_ID,
                "name": "Rolled Omelet",
                "ingredients": ["Egg", "Carrot"],
                "preparation": "Pan-fried",
                "serving_note": "Thin slices",
                "source": "parent",
            }
        ],
    }
    body.update(overrides)
    return body


def review_payload() -> dict:
    return {
        "after_photo_uri": "file:///after.png",
        "outcomes": [
            {
                "food_id": FOOD_ID,
                "decision": {"confirmed": "eaten", "suggested": "eaten"},
                "ingredients": [
                    {
                        "id": "ing-egg",
                        "name": "Egg",
                        "decision": {"confirmed": "eaten", "suggested": None},
                    }
                ],
            }
        ],
        "difficulties": {FOOD_ID: []},
        "saved_at": datetime(2026, 10, 9, 13, 0, tzinfo=UTC).isoformat(),
    }


def suggestion_payload() -> dict:
    return {
        "id": "sug-1",
        "food_id": FOOD_ID,
        "title": "Offer a smaller piece",
        "description": "Rolled omelet was eaten last time.",
        "serving_tip": "Keep the slices thin.",
        "ingredients": ["Egg"],
    }


async def put_meal(
    client: AsyncClient,
    child_id: str = CHILD,
    meal_id: str = MEAL_ID,
    **overrides: object,
):
    return await client.put(
        f"/api/v1/children/{child_id}/meals/{meal_id}",
        json=meal_payload(**overrides),
    )


async def test_upsert_is_idempotent(client: AsyncClient) -> None:
    first = await put_meal(client)
    second = await put_meal(client, foods=[{**meal_payload()["foods"][0], "name": "Omelet"}])

    assert first.status_code == 200
    assert second.status_code == 200
    listed = await client.get(f"/api/v1/children/{CHILD}/meals")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["foods"][0]["name"] == "Omelet"


async def test_list_all_versus_by_date(client: AsyncClient) -> None:
    await put_meal(client)
    await put_meal(
        client,
        meal_id="meal-lunch-1",
        meal_date="2026-10-10",
        meal_type="lunch",
        foods=[{**meal_payload()["foods"][0], "id": "food-soup", "name": "Soup"}],
    )

    all_meals = await client.get(f"/api/v1/children/{CHILD}/meals")
    on_date = await client.get(f"/api/v1/children/{CHILD}/meals", params={"date": "2026-10-09"})

    assert [item["id"] for item in all_meals.json()] == ["meal-lunch-1", MEAL_ID]
    assert [item["id"] for item in on_date.json()] == [MEAL_ID]
    assert all_meals.json()[1]["review_status"] == "awaiting_review"


async def test_calendar_counts_by_density(client: AsyncClient) -> None:
    await put_meal(client, meal_date="2026-10-01")
    await put_meal(client, meal_id="m2", meal_date="2026-10-02")
    await put_meal(client, meal_id="m3", meal_date="2026-10-02")
    await put_meal(client, meal_id="m4", meal_date="2026-10-03")
    await put_meal(client, meal_id="m5", meal_date="2026-10-03")
    await put_meal(client, meal_id="m6", meal_date="2026-10-03")

    res = await client.get(f"/api/v1/children/{CHILD}/meals/calendar", params={"month": "2026-10"})
    by_date = {row["date"]: row["count"] for row in res.json()}

    assert res.status_code == 200
    assert by_date == {"2026-10-01": 1, "2026-10-02": 2, "2026-10-03": 3}


async def test_detail_without_and_with_review_and_suggestion(client: AsyncClient) -> None:
    await put_meal(client)
    empty = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    assert empty.status_code == 200
    assert empty.json()["review"] is None
    assert empty.json()["suggestions"] == []

    review = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json=review_payload(),
    )
    suggestion = await client.post(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/suggestions",
        json=suggestion_payload(),
    )
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")

    assert review.status_code == 200
    assert suggestion.status_code == 200
    assert detail.json()["review"]["after_photo_uri"] == "file:///after.png"
    assert detail.json()["suggestions"][0]["food_id"] == FOOD_ID
    listed = await client.get(f"/api/v1/children/{CHILD}/meals")
    assert listed.json()[0]["review_status"] == "reviewed"


async def test_review_and_suggestion_are_idempotent(client: AsyncClient) -> None:
    await put_meal(client)
    url_review = f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review"
    url_sug = f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/suggestions"
    first_review = await client.put(url_review, json=review_payload())
    second_review = await client.put(url_review, json=review_payload())
    first_sug = await client.post(url_sug, json=suggestion_payload())
    second_sug = await client.post(url_sug, json=suggestion_payload())

    assert first_review.status_code == second_review.status_code == 200
    assert first_sug.json()["id"] == second_sug.json()["id"]
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    assert len(detail.json()["suggestions"]) == 1


async def test_delete_then_not_found(client: AsyncClient) -> None:
    await put_meal(client)
    deleted = await client.delete(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    missing = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")

    assert deleted.status_code == 204
    assert missing.status_code == 404
    assert missing.json()["error_code"] == "MEAL_NOT_FOUND"


async def test_other_child_gets_404(client: AsyncClient) -> None:
    await put_meal(client)
    res = await client.get(f"/api/v1/children/{OTHER}/meals/{MEAL_ID}")
    listed = await client.get(f"/api/v1/children/{OTHER}/meals")

    assert res.status_code == 404
    assert res.json()["error_code"] == "MEAL_NOT_FOUND"
    assert listed.json() == []


async def test_invalid_date_and_month_are_422(client: AsyncClient) -> None:
    bad_date = await client.get(f"/api/v1/children/{CHILD}/meals", params={"date": "2026-13-01"})
    bad_month = await client.get(
        f"/api/v1/children/{CHILD}/meals/calendar",
        params={"month": "2026-13"},
    )
    empty_foods = await put_meal(client, foods=[])

    assert bad_date.status_code == 422
    assert bad_date.json()["error_code"] == "VALIDATION_ERROR"
    assert bad_month.status_code == 422
    assert bad_month.json()["error_code"] == "INVALID_MONTH"
    assert empty_foods.status_code == 422
    assert empty_foods.json()["error_code"] == "EMPTY_FOODS"


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
async def test_final_abc_fields_and_photo_free_review_roundtrip(client: AsyncClient) -> None:
    food = {**meal_payload()["foods"][0], "acceptance": 0, "source": "ai", "confirmed": True}
    link = {
        "suggestion_id": "local-saved",
        "food_id": FOOD_ID,
        "title": "A small portion",
        "description": "Keep the familiar form",
    }
    saved = await put_meal(client, foods=[food], suggestion_links=[link])
    assert saved.status_code == 200, saved.text
    assert saved.json()["foods"][0]["acceptance"] == 0
    assert saved.json()["foods"][0]["source"] == "ai"
    assert saved.json()["foods"][0]["confirmed"] is True
    assert "origin" not in saved.json()["foods"][0]
    assert saved.json()["suggestion_links"][0]["suggestion_id"] == "local-saved"
    review = review_payload()
    review["after_photo_uri"] = ""
    review["outcomes"][0]["ingredients"] = []
    review["suggestion_feedback"] = {"local-saved": {"tried": False}}
    review["difficulties"] = {
        FOOD_ID: [
            {"id": "hardness", "category": "texture", "subcategory": "hardness", "value": "firm"}
        ]
    }
    result = await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review", json=review)
    assert result.status_code == 200, result.text
    loaded = (await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")).json()
    assert loaded["review"]["after_photo_uri"] == ""
    assert loaded["review"]["outcomes"][0]["ingredients"] == []
    assert loaded["review"]["suggestion_feedback"] == {"local-saved": {"tried": False}}
    assert loaded["review"]["difficulties"][FOOD_ID][0]["subcategory"] == "hardness"
    assert loaded["suggestion_links"][0]["food_id"] == FOOD_ID


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
async def test_abc_rejects_invalid_acceptance_dangling_links_and_unlinked_feedback(
    client: AsyncClient,
) -> None:
    food = {**meal_payload()["foods"][0], "acceptance": 4}
    assert (await put_meal(client, foods=[food])).status_code == 422
    link = {"suggestion_id": "saved", "food_id": "missing", "title": "Try", "description": "Idea"}
    assert (await put_meal(client, suggestion_links=[link])).status_code == 422
    # AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    await put_meal(client, suggestion_links=[{**link, "food_id": FOOD_ID}])
    review = {**review_payload(), "suggestion_feedback": {"not-linked": {"tried": True}}}
    assert (
        await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review", json=review)
    ).status_code == 422


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
async def test_suggestion_feedback_requires_a_boolean_tried_property(client: AsyncClient):
    await put_meal(client)
    path = f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review"
    for invalid in (
        "tried",
        "notTried",
        True,
        {},
        {"tried": "false"},
        {"tried": 0},
        {"tried": None},
    ):
        payload = {**review_payload(), "suggestion_feedback": {"legacy-card": invalid}}
        assert (await client.put(path, json=payload)).status_code == 422
    for choice in (True, False):
        feedback = {"legacy-card": {"tried": choice}}
        result = await client.put(path, json={**review_payload(), "suggestion_feedback": feedback})
        assert result.status_code == 200, result.text
        assert result.json()["review"]["suggestion_feedback"] == feedback
    result = await client.put(path, json=review_payload())
    assert result.status_code == 200, result.text
    assert result.json()["review"]["suggestion_feedback"] == {}
