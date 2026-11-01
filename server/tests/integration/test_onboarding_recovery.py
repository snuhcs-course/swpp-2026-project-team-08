# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 복구 테스트의 잘못된 입력 케이스를 새 온보딩 계약으로 변경
"""Integration: HTTP → onboarding service → SQLite; only storage failure is injected."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "case",
    [
        "contradictory-allergy",
        "missing-allergy-answer",
        "required-consent",
        "duplicate-restrictions",
        "nonboolean-consent",
        "unknown-restriction",
        "blank-safe-food",
    ],
)
async def test_invalid_update_preserves_existing_profile_and_consents(client, case):
    headers = await auth_headers(client, "parent@example.com")
    created = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert created.status_code == 200
    before = (await client.get("/api/v1/onboarding", headers=headers)).json()
    invalid = request_body()
    invalid["profile"]["child_name"] = "Must not persist"
    if case == "contradictory-allergy":
        invalid["profile"]["restrictions"] = ["ALLERGY.NONE", "ALLERGY.EGGS"]
    elif case == "missing-allergy-answer":
        invalid["profile"]["restrictions"] = ["VEGETARIAN.DAIRY"]
    elif case == "required-consent":
        invalid["consents"][0]["granted"] = False
    elif case == "duplicate-restrictions":
        invalid["profile"]["restrictions"] = ["ALLERGY.EGGS", "ALLERGY.EGGS"]
    elif case == "nonboolean-consent":
        invalid["consents"][2]["granted"] = "false"
    elif case == "unknown-restriction":
        invalid["profile"]["restrictions"] = ["ALLERGY.NOT_A_REAL_VALUE"]
    else:
        invalid["profile"]["safe_foods"][0]["name"] = "  "
    rejected = await client.put("/api/v1/onboarding", headers=headers, json=invalid)
    assert rejected.status_code == 422
    assert rejected.json()["error_code"] == "VALIDATION_ERROR"
    after = await client.get("/api/v1/onboarding", headers=headers)
    assert after.status_code == 200
    assert after.json() == before


@pytest.mark.asyncio
async def test_storage_failure_rolls_back_profile_and_allows_retry(client, monkeypatch):
    headers = await auth_headers(client, "parent@example.com")
    created = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert created.status_code == 200
    before = (await client.get("/api/v1/onboarding", headers=headers)).json()
    updated = request_body()
    updated["profile"]["child_name"] = "Updated child"
    updated["consents"][2]["granted"] = True
    real_flush = AsyncSession.flush

    async def fail_after_flush(session, *args, **kwargs):
        await real_flush(session, *args, **kwargs)
        raise RuntimeError("injected storage failure")

    with monkeypatch.context() as patch:
        patch.setattr(AsyncSession, "flush", fail_after_flush)
        with pytest.raises(RuntimeError, match="injected storage failure"):
            await client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert (await client.get("/api/v1/onboarding", headers=headers)).json() == before
    retry = await client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert retry.status_code == 200
    assert retry.json()["profile"]["child_name"] == "Updated child"
    stored = (await client.get("/api/v1/onboarding", headers=headers)).json()
    assert stored == retry.json()
    assert (
        next(row for row in stored["consents"] if row["kind"] == "AI_TRAINING")["granted"] is True
    )
