# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

from datetime import UTC, datetime

import jwt
import pytest

from app.features.auth import security
from app.features.auth.security import hash_password, verify_password


@pytest.mark.parametrize(
    ("candidate", "expected"),
    [
        pytest.param("test-password", True, id="동일한_비밀번호"),
        pytest.param("wrong-password", False, id="다른_비밀번호"),
        pytest.param("", False, id="빈_문자열"),
        pytest.param(" test-password ", False, id="앞뒤_공백도_다른_비밀번호"),
    ],
)
def test_비밀번호는_저장한_해시와_일치할_때만_통과한다(candidate, expected):
    # 준비: 암호 함수 자체를 검사하므로 실제 해시를 사용한다.
    hashed = hash_password("test-password")

    # 실행
    matches = verify_password(candidate, hashed)

    # 검증: 임의 salt가 포함된 해시 문자열 자체를 기대값으로 고정하지 않는다.
    assert matches is expected
    assert hashed != "test-password"


@pytest.mark.parametrize(
    ("seconds_left", "wrong_key", "expected_error"),
    [
        pytest.param(1, False, None, id="만료_1초_전"),
        pytest.param(0, False, "expired", id="만료_시각"),
        pytest.param(-1, False, "expired", id="만료_1초_후"),
        pytest.param(60, True, "signature", id="다른_키로_서명"),
    ],
)
def test_토큰은_만료_시각과_서명을_검증한다(monkeypatch, seconds_left, wrong_key, expected_error):
    # 준비: 시간만 고정한다. 토큰 서명과 검증은 실제 구현을 사용한다.
    now = datetime(2026, 11, 2, tzinfo=UTC)

    class FixedClock(datetime):
        @classmethod
        def now(cls, tz=None):
            return now if tz is None else now.astimezone(tz)

    monkeypatch.setattr(jwt.api_jwt, "datetime", FixedClock)
    payload = {"sub": "1", "type": "access", "exp": int(now.timestamp()) + seconds_left}
    key = (
        "different-test-signing-key-32-characters"
        if wrong_key
        else security.settings.JWT_SECRET_KEY
    )
    token = jwt.encode(payload, key, algorithm=security.settings.JWT_ALGORITHM)

    # 실행·검증: 만료와 서명 오류를 같은 실패로 뭉뚱그리지 않는다.
    if expected_error:
        error_type = (
            jwt.ExpiredSignatureError if expected_error == "expired" else jwt.InvalidSignatureError
        )
        with pytest.raises(error_type):
            security.decode_token(token)
    else:
        assert security.decode_token(token) == payload
