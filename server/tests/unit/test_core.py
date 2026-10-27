# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Unit: 설정 검증과 KST 시각. 외부 의존성 없음."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.timezone import now_kst


def test_dev_jwt_secret_rejected_outside_local() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="production")


def test_custom_jwt_secret_allowed_outside_local() -> None:
    settings = Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET_KEY="x" * 32)

    assert settings.ENVIRONMENT == "production"


def test_now_kst_is_aware_utc_plus_9() -> None:
    now = now_kst()

    assert now.utcoffset().total_seconds() == 9 * 3600
