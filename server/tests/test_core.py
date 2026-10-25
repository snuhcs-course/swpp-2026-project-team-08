# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping

"""core 계층 테스트: 헬스체크 / 설정 검증 / KST 시각."""

import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.core.timezone import now_kst


@pytest.mark.asyncio
async def test_health_hides_environment(client: AsyncClient) -> None:
    res = await client.get("/health")

    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "environment" not in body


def test_dev_jwt_secret_rejected_outside_local() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="production")


def test_custom_jwt_secret_allowed_outside_local() -> None:
    settings = Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET_KEY="x" * 32)

    assert settings.ENVIRONMENT == "production"


def test_now_kst_is_aware_utc_plus_9() -> None:
    now = now_kst()

    assert now.utcoffset().total_seconds() == 9 * 3600
