# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

from unittest.mock import AsyncMock

import jwt
import pytest
from fastapi.security import HTTPAuthorizationCredentials

from app.features.auth import dependencies
from app.models import User


@pytest.mark.parametrize(
    ("token_type", "subject", "user_exists", "allowed"),
    [
        pytest.param("access", "1", True, True, id="최소_ID"),
        pytest.param("access", "9223372036854775807", True, True, id="최대_ID"),
        pytest.param("access", "", True, False, id="빈_ID"),
        pytest.param("access", "01", True, False, id="앞자리_0"),
        pytest.param("access", "１", True, False, id="전각_숫자"),
        pytest.param("access", " 1 ", True, False, id="공백_ID"),
        pytest.param("access", 1, True, False, id="숫자_타입_ID"),
        pytest.param("access", None, True, False, id="null_ID"),
        pytest.param(None, "1", True, False, id="토큰_종류_없음"),
        pytest.param("refresh", "1", True, False, id="갱신_토큰_거부"),
        pytest.param("access", "0", True, False, id="0인_사용자_ID_거부"),
        pytest.param("access", "-1", True, False, id="음수_사용자_ID_거부"),
        pytest.param("access", "9223372036854775808", True, False, id="ID_범위_초과"),
        pytest.param("access", "1", False, False, id="없는_사용자_거부"),
    ],
)
async def test_인증_의존성은_액세스_토큰의_실제_사용자만_허용한다(
    monkeypatch, token_type, subject, user_exists, allowed
):
    # 준비: 토큰 해독·DB만 대체한다. 인증 의존성 자체는 실행한다.
    user = User(id=int(subject) if allowed else 1, email="parent@example.com", full_name="보호자")
    session = AsyncMock()
    session.get.return_value = user if user_exists else None
    monkeypatch.setattr(
        dependencies, "decode_token", lambda token: {"sub": subject, "type": token_type}
    )
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token")

    # 실행·검증
    if allowed:
        assert await dependencies.get_current_user(credentials, session) is user
        session.get.assert_awaited_once_with(User, int(subject))
    else:
        with pytest.raises(dependencies.UnauthenticatedError):
            await dependencies.get_current_user(credentials, session)
        if token_type != "access" or subject != "1":
            session.get.assert_not_awaited()


@pytest.mark.parametrize(
    "failure",
    [
        pytest.param("missing-header", id="인증_헤더_없음"),
        pytest.param("missing-subject", id="sub_필드_누락"),
        pytest.param("expired", id="만료된_토큰"),
        pytest.param("signature", id="서명이_다른_토큰"),
    ],
)
async def test_해독할_수_없는_인증은_DB_조회_전에_거부한다(monkeypatch, failure):
    session = AsyncMock()

    def decode(token):
        if failure == "missing-subject":
            return {"type": "access"}
        if failure == "expired":
            raise jwt.ExpiredSignatureError()
        raise jwt.InvalidSignatureError()

    monkeypatch.setattr(dependencies, "decode_token", decode)
    credentials = (
        None
        if failure == "missing-header"
        else HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token")
    )

    with pytest.raises(dependencies.UnauthenticatedError):
        await dependencies.get_current_user(credentials, session)

    session.get.assert_not_awaited()
