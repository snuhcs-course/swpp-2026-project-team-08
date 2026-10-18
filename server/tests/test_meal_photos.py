# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""식전 · 식후 사진 URI 가 식사 기록에 저장되고 다시 읽히는지 검증한다."""

from datetime import UTC, datetime

from httpx import AsyncClient

CHILD = "child-photo"
MEAL_ID = "meal-photo-1"
FOOD_ID = "food-rice"
BEFORE_URI = "file:///meal-photos/before.png"
AFTER_URI = "file:///meal-photos/after.png"
DATA_URI = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
TRAITS = {
    "texture": [],
    "tasteType": [],
    "tasteIntensity": [],
    "smell": [],
    "shape": [],
    "visibility": [],
    "temperature": [],
    "color": [],
}


def meal_payload(**overrides: object) -> dict:
    body: dict = {
        "meal_date": "2026-10-15",
        "meal_type": "lunch",
        "setting": "home",
        "before_photo_uri": None,
        "saved_at": datetime(2026, 10, 15, 12, 0, tzinfo=UTC).isoformat(),
        "foods": [
            {
                "id": FOOD_ID,
                "name": "Rice",
                "ingredients": ["Egg"],
                "preparation": "",
                "serving_note": "",
                "traits": TRAITS,
                "history": None,
                "source": "parent",
            }
        ],
    }
    body.update(overrides)
    return body


def review_payload() -> dict:
    return {
        "after_photo_uri": AFTER_URI,
        "outcomes": [
            {
                "food_id": FOOD_ID,
                "decision": {"confirmed": "eaten", "suggested": "unclear"},
                "ingredients": [
                    {
                        "id": "ing-egg",
                        "name": "Egg",
                        "decision": {"confirmed": "tasted", "suggested": None},
                    }
                ],
            }
        ],
        "difficulties": {FOOD_ID: []},
        "saved_at": datetime(2026, 10, 15, 13, 0, tzinfo=UTC).isoformat(),
    }


async def put_meal(client: AsyncClient, **overrides: object):
    return await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}",
        json=meal_payload(**overrides),
    )


async def test_before_photo_round_trips_on_meal_upsert(client: AsyncClient) -> None:
    created = await put_meal(client, before_photo_uri=BEFORE_URI)
    listed = await client.get(f"/api/v1/children/{CHILD}/meals")
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")

    assert created.status_code == 200
    assert created.json()["before_photo_uri"] == BEFORE_URI
    assert listed.json()[0]["before_photo_uri"] == BEFORE_URI
    assert detail.json()["before_photo_uri"] == BEFORE_URI
    assert detail.json()["review"] is None


async def test_meal_can_be_saved_without_a_before_photo(client: AsyncClient) -> None:
    created = await put_meal(client, before_photo_uri=None)

    assert created.status_code == 200
    assert created.json()["before_photo_uri"] is None


async def test_replacing_before_photo_keeps_one_meal(client: AsyncClient) -> None:
    await put_meal(client, before_photo_uri=BEFORE_URI)
    replaced = await put_meal(client, before_photo_uri=DATA_URI)
    listed = await client.get(f"/api/v1/children/{CHILD}/meals")

    assert replaced.status_code == 200
    assert replaced.json()["before_photo_uri"] == DATA_URI
    assert len(listed.json()) == 1


# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
async def test_photo_free_review_preserves_before_photo_and_rejects_wrong_types(
    client: AsyncClient,
) -> None:
    await put_meal(client, before_photo_uri=BEFORE_URI)
    empty = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={**review_payload(), "after_photo_uri": ""},
    )
    missing = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={k: v for k, v in review_payload().items() if k != "after_photo_uri"},
    )

    assert empty.status_code == 200
    assert missing.status_code == 200
    assert empty.json()["before_photo_uri"] == BEFORE_URI
    assert missing.json()["review"]["after_photo_uri"] == ""
    invalid = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={**review_payload(), "after_photo_uri": {}},
    )
    assert invalid.status_code == 422
    assert invalid.json()["error_code"] == "VALIDATION_ERROR"


async def test_after_photo_cannot_be_saved_before_the_meal(client: AsyncClient) -> None:
    res = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json=review_payload(),
    )

    assert res.status_code == 404
    assert res.json()["error_code"] == "MEAL_NOT_FOUND"


async def test_before_and_after_photos_round_trip_together(client: AsyncClient) -> None:
    await put_meal(client, before_photo_uri=DATA_URI)
    review = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={**review_payload(), "after_photo_uri": AFTER_URI},
    )
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")

    assert review.status_code == 200
    assert review.json()["before_photo_uri"] == DATA_URI
    assert review.json()["review"]["after_photo_uri"] == AFTER_URI
    assert detail.json()["before_photo_uri"] == DATA_URI
    assert detail.json()["review"]["after_photo_uri"] == AFTER_URI


async def test_replacing_after_photo_does_not_drop_before_photo(client: AsyncClient) -> None:
    await put_meal(client, before_photo_uri=BEFORE_URI)
    await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={**review_payload(), "after_photo_uri": AFTER_URI},
    )
    updated = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json={**review_payload(), "after_photo_uri": DATA_URI},
    )

    assert updated.status_code == 200
    assert updated.json()["before_photo_uri"] == BEFORE_URI
    assert updated.json()["review"]["after_photo_uri"] == DATA_URI


async def test_upsert_payload_accepts_the_client_photo_fields(client: AsyncClient) -> None:
    """Client mealToUpsertBody / reviewToBody field names stay accepted by the API."""
    meal = meal_payload()
    meal["before_photo_uri"] = BEFORE_URI
    saved = await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}", json=meal)
    review = review_payload()
    review["after_photo_uri"] = AFTER_URI
    reviewed = await client.put(
        f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review",
        json=review,
    )

    assert saved.status_code == 200
    assert reviewed.status_code == 200
    assert saved.json()["before_photo_uri"] == BEFORE_URI
    assert reviewed.json()["review"]["after_photo_uri"] == AFTER_URI
    assert reviewed.json()["foods"][0]["id"] == FOOD_ID
