# AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim
"""식사 기록 API 테스트."""

from datetime import UTC, datetime

from httpx import AsyncClient

CHILD = "child-1"
OTHER = "child-2"
MEAL_ID = "meal-dinner-1"
FOOD_ID = "food-omelet"

TRAITS = {
    "texture": ["soft"],
    "tasteType": [],
    "tasteIntensity": [],
    "smell": [],
    "shape": ["sliced"],
    "visibility": [],
    "temperature": ["warm"],
    "color": [],
}


def meal_payload(**overrides: object) -> dict:
    body: dict = {
        "meal_date": "2026-10-09",
        "meal_type": "dinner",
        "setting": "home",
        "before_photo_uri": "file:///before.png",
        "exposure_food_id": FOOD_ID,
        "saved_at": datetime(2026, 10, 9, 12, 0, tzinfo=UTC).isoformat(),
        "foods": [
            {
                "id": FOOD_ID,
                "name": "Rolled Omelet",
                "ingredients": ["Egg", "Carrot"],
                "preparation": "Pan-fried",
                "serving_note": "Thin slices",
                "traits": TRAITS,
                "history": "usually",
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
        "goal_feedback": "tried",
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
        exposure_food_id="food-soup",
    )

    all_meals = await client.get(f"/api/v1/children/{CHILD}/meals")
    on_date = await client.get(f"/api/v1/children/{CHILD}/meals", params={"date": "2026-10-09"})

    assert [item["id"] for item in all_meals.json()] == ["meal-lunch-1", MEAL_ID]
    assert [item["id"] for item in on_date.json()] == [MEAL_ID]
    assert all_meals.json()[1]["review_status"] == "awaiting_review"


async def test_calendar_counts_by_density(client: AsyncClient) -> None:
    await put_meal(client, meal_date="2026-10-01")
    await put_meal(client, meal_id="m2", meal_date="2026-10-02", exposure_food_id=None)
    await put_meal(client, meal_id="m3", meal_date="2026-10-02", exposure_food_id=None)
    await put_meal(client, meal_id="m4", meal_date="2026-10-03", exposure_food_id=None)
    await put_meal(client, meal_id="m5", meal_date="2026-10-03", exposure_food_id=None)
    await put_meal(client, meal_id="m6", meal_date="2026-10-03", exposure_food_id=None)

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
