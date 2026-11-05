# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: HTTP 테스트 fixture 이름을 api_client로 명확화
"""Integration: 앱 라우팅 → health 응답. DB fixture는 테스트용 SQLite를 사용한다."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_hides_environment(api_client: AsyncClient) -> None:
    res = await api_client.get("/health")

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "environment" not in body
