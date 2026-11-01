# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 통합 테스트를 restrictions 목록과 안전 음식 전체 교체 기준으로 재작성
"""Onboarding API persistence, ownership, and validation."""

import pytest
from httpx import AsyncClient

from app.features.onboarding.consent_version import DOCUMENT_VERSION
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


@pytest.mark.asyncio
async def test_onboarding_round_trip_and_idempotent_consents(client: AsyncClient) -> None:
    headers = await auth_headers(client, "parent@example.com")
    empty = await client.get("/api/v1/onboarding", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == {"profile": None, "consents": []}

    written = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert written.status_code == 200, written.text
    body = written.json()
    profile = body["profile"]
    assert profile["user_id"].isdecimal()
    assert profile["age_group"] == "AGE_4_5"
    assert profile["restrictions"] == ["ALLERGY.EGGS", "VEGETARIAN.DAIRY"]
    assert set(profile) == {
        "user_id",
        "child_name",
        "age_group",
        "restrictions",
        "safe_foods",
        "updated_at",
    }
    assert [food["name"] for food in profile["safe_foods"]] == ["감자", "쌀밥"]
    assert all(food["id"].isdecimal() for food in profile["safe_foods"])
    assert len(body["consents"]) == 3
    assert {row["kind"] for row in body["consents"]} == {
        "ACCOUNT_PRIVACY",
        "PHOTO_ANALYSIS",
        "AI_TRAINING",
    }
    assert {row["document_version"] for row in body["consents"]} == {DOCUMENT_VERSION}
    assert (await client.get("/api/v1/onboarding", headers=headers)).json() == body

    # 같은 내용을 다시 저장해도 동의 기록은 늘지 않는다.
    repeat = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert repeat.status_code == 200, repeat.text
    assert [row["id"] for row in repeat.json()["consents"]] == [
        row["id"] for row in body["consents"]
    ]

    updated = request_body()
    updated["profile"]["child_name"] = "새 이름"
    updated["profile"]["restrictions"] = ["ALLERGY.NONE"]
    updated["consents"][2]["granted"] = True
    changed = await client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert changed.status_code == 200, changed.text
    assert changed.json()["profile"]["child_name"] == "새 이름"
    assert changed.json()["profile"]["restrictions"] == ["ALLERGY.NONE"]
    old_ids = {row["kind"]: row["id"] for row in body["consents"]}
    new_ids = {row["kind"]: row["id"] for row in changed.json()["consents"]}
    assert old_ids["ACCOUNT_PRIVACY"] == new_ids["ACCOUNT_PRIVACY"]
    assert old_ids["PHOTO_ANALYSIS"] == new_ids["PHOTO_ANALYSIS"]
    assert old_ids["AI_TRAINING"] != new_ids["AI_TRAINING"]


@pytest.mark.asyncio
async def test_safe_foods_are_replaced_in_request_order(client: AsyncClient) -> None:
    headers = await auth_headers(client, "parent@example.com")
    first = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    first_foods = first.json()["profile"]["safe_foods"]
    assert [food["name"] for food in first_foods] == ["감자", "쌀밥"]

    # 순서를 바꾸고 하나를 더해 저장하면 요청 순서대로 돌아온다.
    reordered = request_body()
    reordered["profile"]["safe_foods"] = [
        {"name": "쌀밥", "preparation": "질게 짓기", "presentation_note": None},
        {"name": "감자", "preparation": "찌기", "presentation_note": "작게"},
        {"name": "바나나", "preparation": "으깨기", "presentation_note": None},
    ]
    second = await client.put("/api/v1/onboarding", headers=headers, json=reordered)
    assert second.status_code == 200, second.text
    foods = second.json()["profile"]["safe_foods"]
    assert [food["name"] for food in foods] == ["쌀밥", "감자", "바나나"]
    assert foods[1]["preparation"] == "찌기"
    assert (await client.get("/api/v1/onboarding", headers=headers)).json() == second.json()

    # 빈 목록을 저장하면 안전 음식이 모두 없어진다.
    cleared = request_body()
    cleared["profile"]["safe_foods"] = []
    removed = await client.put("/api/v1/onboarding", headers=headers, json=cleared)
    assert removed.status_code == 200, removed.text
    assert removed.json()["profile"]["safe_foods"] == []
    assert (await client.get("/api/v1/onboarding", headers=headers)).json()["profile"][
        "safe_foods"
    ] == []


@pytest.mark.asyncio
async def test_onboarding_is_authenticated_and_isolated(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/onboarding")).status_code == 401
    assert (await client.put("/api/v1/onboarding", json=request_body())).status_code == 401
    first = await auth_headers(client, "first@example.com")
    second = await auth_headers(client, "second@example.com")
    assert (
        await client.put("/api/v1/onboarding", headers=first, json=request_body())
    ).status_code == 200
    assert (await client.get("/api/v1/onboarding", headers=second)).json() == {
        "profile": None,
        "consents": [],
    }

    # 한 사용자의 저장이 다른 사용자의 안전 음식에 영향을 주지 않는다.
    other = request_body()
    other["profile"]["safe_foods"] = [
        {"name": "고구마", "preparation": "굽기", "presentation_note": None}
    ]
    assert (await client.put("/api/v1/onboarding", headers=second, json=other)).status_code == 200
    assert [
        food["name"]
        for food in (await client.get("/api/v1/onboarding", headers=first)).json()["profile"][
            "safe_foods"
        ]
    ] == ["감자", "쌀밥"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("path", "value"),
    [
        (("profile", "safety"), {"allergies": {"status": "none_known", "items": []}}),
        (("profile", "food_preferences"), {"family_foods": []}),
        (("profile", "smell_sensitivity"), "yes"),
        (("profile", "difficult_textures"), []),
    ],
    ids=["safety", "food_preferences", "smell_sensitivity", "difficult_textures"],
)
async def test_onboarding_rejects_removed_fields(
    client: AsyncClient, path: tuple[str, str], value: object
) -> None:
    headers = await auth_headers(client, "parent@example.com")
    payload = request_body()
    payload[path[0]][path[1]] = value
    response = await client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert (await client.get("/api/v1/onboarding", headers=headers)).json()["profile"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "restrictions",
    [
        [],
        ["VEGETARIAN.DAIRY"],
        ["ALLERGY.NONE", "ALLERGY.EGGS"],
        ["ALLERGY.EGGS", "ALLERGY.EGGS"],
        ["ALLERGY.UNKNOWN"],
        ["peanut"],
    ],
    ids=[
        "empty",
        "no-allergy-answer",
        "none-with-allergy",
        "duplicate",
        "unknown-value",
        "old-value",
    ],
)
async def test_invalid_restrictions_are_rejected_without_saving(
    client: AsyncClient, restrictions: list[str]
) -> None:
    headers = await auth_headers(client, "parent@example.com")
    payload = request_body()
    payload["profile"]["restrictions"] = restrictions
    response = await client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert (await client.get("/api/v1/onboarding", headers=headers)).json() == {
        "profile": None,
        "consents": [],
    }


@pytest.mark.asyncio
async def test_old_lowercase_values_are_rejected(client: AsyncClient) -> None:
    headers = await auth_headers(client, "parent@example.com")
    payload = request_body()
    payload["profile"]["age_group"] = "4-5"
    payload["consents"][0]["kind"] = "account_privacy"
    response = await client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    fields = {tuple(item["loc"]) for item in response.json()["details"]["fields"]}
    assert ("body", "profile", "age_group") in fields
    assert ("body", "consents", 0, "kind") in fields
