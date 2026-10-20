"""Onboarding API persistence, ownership, and validation."""

import pytest
from httpx import AsyncClient

from app.features.onboarding.consent_version import DOCUMENT_VERSION


def request_body() -> dict:
    return {
        "profile": {
            "child_name": "아이",
            "age_group": "4-5",
            "safety": {
                "allergies": {
                    "status": "specified",
                    "items": [{"code": "egg", "custom_name": None}],
                },
                "restrictions": {"status": "none", "items": []},
            },
            "food_preferences": {
                "family_foods": [{"code": "eggs", "custom_name": None}],
                "dietary_approaches": [],
                "difficult_textures": [],
                "smell_sensitivity": "sometimes",
                "difficult_tastes": [],
                "presentation_preferences": [],
                "preferred_temperature": "warm",
                "new_food_response": "plate",
            },
            "safe_foods": {
                "status": "listed",
                "items": [
                    {
                        "name": "감자",
                        "preparation": "푹 삶기",
                        "presentation_note": "작게 잘라 제공",
                    }
                ],
            },
        },
        "consents": [
            {"kind": "account_privacy", "granted": True},
            {"kind": "photo_analysis", "granted": True},
            {"kind": "ai_training", "granted": False},
        ],
    }


async def register(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "supersecret", "full_name": "보호자"},
    )
    login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "supersecret"}
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


@pytest.mark.asyncio
async def test_onboarding_round_trip_and_idempotent_consents(client: AsyncClient) -> None:
    headers = await register(client, "parent@example.com")
    empty = await client.get("/api/v1/onboarding", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == {"profile": None, "consents": []}

    written = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert written.status_code == 200, written.text
    body = written.json()
    assert body["profile"]["user_id"].isdecimal()
    assert body["profile"]["safety"]["allergies"]["items"] == [{"code": "egg", "custom_name": None}]
    food_id = body["profile"]["safe_foods"]["items"][0]["id"]
    assert food_id.isdecimal()
    assert len(body["consents"]) == 3
    assert {row["document_version"] for row in body["consents"]} == {DOCUMENT_VERSION}
    assert (await client.get("/api/v1/onboarding", headers=headers)).json() == body

    repeat = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert repeat.status_code == 200, repeat.text
    assert [row["id"] for row in repeat.json()["consents"]] == [
        row["id"] for row in body["consents"]
    ]

    updated = request_body()
    updated["profile"]["safe_foods"]["items"][0]["id"] = food_id
    updated["profile"]["safe_foods"]["items"][0]["preparation"] = "찌기"
    updated["profile"]["child_name"] = "새 이름"
    updated["consents"][2]["granted"] = True
    changed = await client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert changed.status_code == 200, changed.text
    assert changed.json()["profile"]["safe_foods"]["items"][0]["id"] == food_id
    assert changed.json()["profile"]["child_name"] == "새 이름"
    old_ids = {row["kind"]: row["id"] for row in body["consents"]}
    new_ids = {row["kind"]: row["id"] for row in changed.json()["consents"]}
    assert old_ids["account_privacy"] == new_ids["account_privacy"]
    assert old_ids["photo_analysis"] == new_ids["photo_analysis"]
    assert old_ids["ai_training"] != new_ids["ai_training"]

    cleared = request_body()
    cleared["profile"]["safe_foods"] = {"status": "none", "items": []}
    removed = await client.put("/api/v1/onboarding", headers=headers, json=cleared)
    assert removed.status_code == 200, removed.text
    assert removed.json()["profile"]["safe_foods"] == {"status": "none", "items": []}
    assert (await client.get("/api/v1/onboarding", headers=headers)).json()["profile"][
        "safe_foods"
    ] == {"status": "none", "items": []}


@pytest.mark.asyncio
async def test_onboarding_rejects_invalid_input_and_other_users_food(client: AsyncClient) -> None:
    first = await register(client, "first@example.com")
    second = await register(client, "second@example.com")
    initial = await client.put("/api/v1/onboarding", headers=first, json=request_body())
    food_id = initial.json()["profile"]["safe_foods"]["items"][0]["id"]

    other = request_body()
    other["profile"]["safe_foods"]["items"][0]["id"] = food_id
    denied = await client.put("/api/v1/onboarding", headers=second, json=other)
    assert denied.status_code == 422
    assert denied.json()["error_code"] == "SAFE_FOOD_NOT_FOUND"
    assert (await client.get("/api/v1/onboarding", headers=second)).json()["profile"] is None

    invalid = request_body()
    invalid["profile"]["safety"]["allergies"] = {
        "status": "none_known",
        "items": [{"code": "egg", "custom_name": None}],
    }
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422
    invalid = request_body()
    invalid["consents"][0]["granted"] = False
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422
    invalid = request_body()
    invalid["profile"]["food_preferences"]["family_foods"] = []
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422
    invalid = request_body()
    invalid["profile"]["food_preferences"]["family_foods"] *= 2
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422
    invalid = request_body()
    invalid["consents"][2]["granted"] = "false"
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422
    invalid = request_body()
    invalid["profile"]["food_preferences"]["family_foods"][0]["code"] = "none"
    assert (await client.put("/api/v1/onboarding", headers=first, json=invalid)).status_code == 422


@pytest.mark.asyncio
async def test_onboarding_is_authenticated_and_isolated(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/onboarding")).status_code == 401
    assert (await client.put("/api/v1/onboarding", json=request_body())).status_code == 401
    first = await register(client, "first@example.com")
    second = await register(client, "second@example.com")
    assert (
        await client.put("/api/v1/onboarding", headers=first, json=request_body())
    ).status_code == 200
    assert (await client.get("/api/v1/onboarding", headers=second)).json() == {
        "profile": None,
        "consents": [],
    }
