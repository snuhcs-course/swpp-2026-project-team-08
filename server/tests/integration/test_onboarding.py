# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 통합 테스트를 restrictions 목록과 안전 음식 전체 교체 기준으로 재작성
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 저장·조회와 조리 방법 없는 익숙한 음식 검증
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

"""Onboarding API persistence, ownership, and validation."""

import pytest
from httpx import AsyncClient

from app.features.onboarding.consent_version import DOCUMENT_VERSION
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


@pytest.mark.asyncio
async def test_onboarding_round_trip_and_idempotent_consents(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "parent@example.com")
    empty = await api_client.get("/api/v1/onboarding", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == {"profile": None, "consents": []}

    written = await api_client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert written.status_code == 200, written.text
    body = written.json()
    profile = body["profile"]
    assert profile["user_id"].isdecimal()
    assert profile["age_group"] == "AGE_4_5"
    assert profile["restrictions"] == ["ALLERGY.EGGS", "VEGETARIAN.DAIRY"]
    assert profile["dietary_pattern"] is None
    assert set(profile) == {
        "user_id",
        "child_name",
        "age_group",
        "restrictions",
        "dietary_pattern",
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
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json() == body

    # 같은 내용을 다시 저장해도 동의 기록은 늘지 않는다.
    repeat = await api_client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert repeat.status_code == 200, repeat.text
    assert [row["id"] for row in repeat.json()["consents"]] == [
        row["id"] for row in body["consents"]
    ]

    updated = request_body()
    updated["profile"]["child_name"] = "새 이름"
    updated["profile"]["restrictions"] = ["ALLERGY.NONE"]
    updated["consents"][2]["granted"] = True
    changed = await api_client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert changed.status_code == 200, changed.text
    assert changed.json()["profile"]["child_name"] == "새 이름"
    assert changed.json()["profile"]["restrictions"] == ["ALLERGY.NONE"]
    old_ids = {row["kind"]: row["id"] for row in body["consents"]}
    new_ids = {row["kind"]: row["id"] for row in changed.json()["consents"]}
    assert old_ids["ACCOUNT_PRIVACY"] == new_ids["ACCOUNT_PRIVACY"]
    assert old_ids["PHOTO_ANALYSIS"] == new_ids["PHOTO_ANALYSIS"]
    assert old_ids["AI_TRAINING"] != new_ids["AI_TRAINING"]


@pytest.mark.asyncio
async def test_safe_foods_are_replaced_in_request_order(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "parent@example.com")
    first = await api_client.put("/api/v1/onboarding", headers=headers, json=request_body())
    first_foods = first.json()["profile"]["safe_foods"]
    assert [food["name"] for food in first_foods] == ["감자", "쌀밥"]

    # 순서를 바꾸고 하나를 더해 저장하면 요청 순서대로 돌아온다.
    reordered = request_body()
    reordered["profile"]["safe_foods"] = [
        {"name": "쌀밥", "preparation": "질게 짓기", "presentation_note": None},
        {"name": "감자", "preparation": "찌기", "presentation_note": "작게"},
        {"name": "바나나", "preparation": "으깨기", "presentation_note": None},
    ]
    second = await api_client.put("/api/v1/onboarding", headers=headers, json=reordered)
    assert second.status_code == 200, second.text
    foods = second.json()["profile"]["safe_foods"]
    assert [food["name"] for food in foods] == ["쌀밥", "감자", "바나나"]
    assert foods[1]["preparation"] == "찌기"
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json() == second.json()

    # 빈 목록을 저장하면 안전 음식이 모두 없어진다.
    cleared = request_body()
    cleared["profile"]["safe_foods"] = []
    removed = await api_client.put("/api/v1/onboarding", headers=headers, json=cleared)
    assert removed.status_code == 200, removed.text
    assert removed.json()["profile"]["safe_foods"] == []
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json()["profile"][
        "safe_foods"
    ] == []


@pytest.mark.asyncio
async def test_onboarding_is_authenticated_and_isolated(api_client: AsyncClient) -> None:
    assert (await api_client.get("/api/v1/onboarding")).status_code == 401
    assert (await api_client.put("/api/v1/onboarding", json=request_body())).status_code == 401
    first = await auth_headers(api_client, "first@example.com")
    second = await auth_headers(api_client, "second@example.com")
    assert (
        await api_client.put("/api/v1/onboarding", headers=first, json=request_body())
    ).status_code == 200
    assert (await api_client.get("/api/v1/onboarding", headers=second)).json() == {
        "profile": None,
        "consents": [],
    }

    # 한 사용자의 저장이 다른 사용자의 안전 음식에 영향을 주지 않는다.
    other = request_body()
    other["profile"]["safe_foods"] = [
        {"name": "고구마", "preparation": "굽기", "presentation_note": None}
    ]
    assert (
        await api_client.put("/api/v1/onboarding", headers=second, json=other)
    ).status_code == 200
    assert [
        food["name"]
        for food in (await api_client.get("/api/v1/onboarding", headers=first)).json()["profile"][
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
    api_client: AsyncClient, path: tuple[str, str], value: object
) -> None:
    headers = await auth_headers(api_client, "parent@example.com")
    payload = request_body()
    payload[path[0]][path[1]] = value
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json()["profile"] is None


@pytest.mark.asyncio
async def test_dietary_pattern_save_reload_and_clear(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "pattern@example.com")
    body = request_body()
    first = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert first.status_code == 200, first.text
    assert first.json()["profile"]["dietary_pattern"] is None
    for pattern in [
        "VEGAN",
        "LACTO_VEGETARIAN",
        "OVO_VEGETARIAN",
        "LACTO_OVO_VEGETARIAN",
        "PESCATARIAN",
        "FLEXITARIAN",
        "NO_SPECIFIC_PATTERN",
        None,
    ]:
        body["profile"]["dietary_pattern"] = pattern
        written = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
        assert written.status_code == 200, written.text
        loaded = (await api_client.get("/api/v1/onboarding", headers=headers)).json()["profile"]
        assert loaded["dietary_pattern"] == pattern
        # 식생활 유형은 제한 목록과 별개라 제한을 바꾸지 않는다.
        assert loaded["restrictions"] == body["profile"]["restrictions"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "value", ["vegan", "EGGS", "", 1], ids=["lowercase", "unknown", "empty", "int"]
)
async def test_invalid_dietary_pattern_is_rejected_without_saving(
    api_client: AsyncClient, value: object
) -> None:
    headers = await auth_headers(api_client, "pattern@example.com")
    payload = request_body()
    payload["profile"]["dietary_pattern"] = value
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json()["profile"] is None


@pytest.mark.asyncio
async def test_dietary_pattern_field_is_required(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "pattern@example.com")
    payload = request_body()
    del payload["profile"]["dietary_pattern"]
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_safe_food_preparation_is_optional_and_blank_is_stored_as_null(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "optional-food@example.com")
    body = request_body()
    body["profile"]["safe_foods"] = [
        {"name": "감자", "preparation": None, "presentation_note": None},
        {"name": "쌀밥", "preparation": "  ", "presentation_note": "작게"},
        {"name": "바나나", "preparation": "으깨기", "presentation_note": None},
    ]
    saved = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert saved.status_code == 200, saved.text
    foods = saved.json()["profile"]["safe_foods"]
    assert [food["preparation"] for food in foods] == [None, None, "으깨기"]
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json() == saved.json()

    # 이름은 여전히 필수다.
    body["profile"]["safe_foods"][0]["name"] = " "
    invalid = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert invalid.status_code == 422
    after = (await api_client.get("/api/v1/onboarding", headers=headers)).json()
    assert [food["name"] for food in after["profile"]["safe_foods"]] == ["감자", "쌀밥", "바나나"]


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
    api_client: AsyncClient, restrictions: list[str]
) -> None:
    headers = await auth_headers(api_client, "parent@example.com")
    payload = request_body()
    payload["profile"]["restrictions"] = restrictions
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert (await api_client.get("/api/v1/onboarding", headers=headers)).json() == {
        "profile": None,
        "consents": [],
    }


@pytest.mark.asyncio
async def test_old_lowercase_values_are_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "parent@example.com")
    payload = request_body()
    payload["profile"]["age_group"] = "4-5"
    payload["consents"][0]["kind"] = "account_privacy"
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    fields = {tuple(item["loc"]) for item in response.json()["details"]["fields"]}
    assert ("body", "profile", "age_group") in fields
    assert ("body", "consents", 0, "kind") in fields
