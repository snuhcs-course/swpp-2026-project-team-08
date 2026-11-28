# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: 제거된 Safe Food 필드 거절과 저장 보존 검증
"""Removed profile fields are rejected without changing saved data."""

import pytest

from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


@pytest.mark.asyncio
async def test_removed_safe_foods_field_is_rejected(api_client):
    headers = await auth_headers(api_client, "safe-foods@example.com")
    body = request_body()
    saved = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert saved.status_code == 200
    assert "safe_foods" not in saved.json()["profile"]
    body["profile"]["safe_foods"] = []
    rejected = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert rejected.status_code == 422
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)
    assert loaded.json() == saved.json()
