# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Onboarding API persistence, ownership, and validation."""

import pytest
from httpx import AsyncClient

from app.features.onboarding.consent_version import DOCUMENT_VERSION
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers as register


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
async def test_onboarding_rejects_other_users_food(client: AsyncClient) -> None:
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
