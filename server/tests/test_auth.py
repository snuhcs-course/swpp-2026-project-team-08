# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
# Changed: 마이페이지·자녀 프로필 추가

"""회원가입 / 로그인 happy-path + 주요 에러 케이스."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import get_session
from app.core.timezone import now_kst
from app.features.auth.security import create_access_token, decode_token
from app.main import app
from app.models import Meal, ReviewFoodResult, UserSuggestion

SIGNUP_PAYLOAD = {
    "email": "user@example.com",
    "password": "supersecret",
    "full_name": "홍길동",
}


@pytest.mark.asyncio
async def test_signup_creates_user(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    assert res.status_code == 201
    body = res.json()
    assert body["email"] == SIGNUP_PAYLOAD["email"]
    assert body["full_name"] == SIGNUP_PAYLOAD["full_name"]
    assert isinstance(body["id"], str) and body["id"].isdecimal() and int(body["id"]) > 0
    assert "created_at" in body
    assert "password" not in body  # 비밀번호는 응답에 노출되지 않음
    assert "hashed_password" not in body


@pytest.mark.asyncio
async def test_signup_duplicate_email_conflict(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    res = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    assert res.status_code == 409
    assert res.json() == {
        "error_code": "EMAIL_ALREADY_EXISTS",
        "details": {"email": SIGNUP_PAYLOAD["email"]},
    }


@pytest.mark.asyncio
async def test_email_identity_is_case_insensitive(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    duplicate = await client.post(
        "/api/v1/auth/signup",
        json={**SIGNUP_PAYLOAD, "email": "USER@example.com"},
    )
    assert duplicate.status_code == 409
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "USER@example.com", "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_signup_short_password_rejected(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "password": "short"})

    assert res.status_code == 422
    # 비밀번호는 응답에 되돌려 주지 않는다.
    assert res.json() == {"error_code": "INVALID_PASSWORD_LENGTH", "details": {}}


@pytest.mark.asyncio
async def test_signup_invalid_email_rejected(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "email": "not-an-email"})

    assert res.status_code == 422
    assert res.json() == {"error_code": "INVALID_EMAIL", "details": {"input": "not-an-email"}}


@pytest.mark.asyncio
async def test_signup_empty_full_name_rejected(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "full_name": ""})

    assert res.status_code == 422
    assert res.json() == {"error_code": "INVALID_FULL_NAME_LENGTH", "details": {"input": ""}}


@pytest.mark.asyncio
async def test_signup_whitespace_full_name_rejected(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "full_name": "   "})
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_FULL_NAME_LENGTH"


@pytest.mark.asyncio
async def test_signup_missing_field_is_validation_error(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json={"email": SIGNUP_PAYLOAD["email"]})

    assert res.status_code == 422
    body = res.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert {"loc": ["body", "password"], "type": "missing"} in body["details"]["fields"]


@pytest.mark.asyncio
async def test_login_returns_tokens(client: AsyncClient) -> None:
    signup = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert decode_token(body["access_token"])["sub"] == signup.json()["id"]
    assert decode_token(body["refresh_token"])["sub"] == signup.json()["id"]


@pytest.mark.asyncio
async def test_login_wrong_password_unauthorized(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": "wrong-password"},
    )

    assert res.status_code == 401
    assert res.json() == {"error_code": "INVALID_CREDENTIALS", "details": {}}


async def _sign_up_and_login(client: AsyncClient) -> dict:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    return res.json()


@pytest.mark.asyncio
async def test_me_returns_current_user(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)

    res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )

    assert res.status_code == 200
    assert res.json()["email"] == SIGNUP_PAYLOAD["email"]


@pytest.mark.asyncio
async def test_me_without_token_unauthorized(client: AsyncClient) -> None:
    res = await client.get("/api/v1/auth/me")

    assert res.status_code == 401
    assert res.json() == {"error_code": "UNAUTHENTICATED", "details": {}}


@pytest.mark.asyncio
async def test_me_documents_unauthenticated_response(client: AsyncClient) -> None:
    # get_current_user 가 들고 있는 에러 선언이 /docs 에 자동으로 나타난다.
    schema = (await client.get("/openapi.json")).json()
    responses = schema["paths"]["/api/v1/auth/me"]["get"]["responses"]

    assert responses["401"]["description"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_me_with_invalid_token_unauthorized(client: AsyncClient) -> None:
    res = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"})

    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "subject", ["3fa85f64-5717-4562-b3fc-2c963f66afa6", "0", "01", "9223372036854775808"]
)
async def test_me_rejects_non_bigint_token_subject(client: AsyncClient, subject: str) -> None:
    token = create_access_token(subject)
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_me_rejects_refresh_token(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)

    res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )

    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_login_unknown_email_unauthorized(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "supersecret"},
    )

    # 존재하지 않는 이메일도 비밀번호 오류와 동일하게 응답한다.
    assert res.status_code == 401
    assert res.json()["error_code"] == "INVALID_CREDENTIALS"


def _auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_patch_me_updates_full_name(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)

    res = await client.patch(
        "/api/v1/auth/me",
        headers=_auth_header(tokens),
        json={"full_name": "김도연"},
    )

    assert res.status_code == 200
    assert res.json()["full_name"] == "김도연"
    me = await client.get("/api/v1/auth/me", headers=_auth_header(tokens))
    assert me.json()["full_name"] == "김도연"


@pytest.mark.asyncio
async def test_email_change_requires_server_code(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: "482190")
    tokens = await _sign_up_and_login(client)

    sent = await client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "new@example.com"},
    )
    assert sent.status_code == 200
    assert sent.json() == {"sent": True, "dev_code": "482190"}

    wrong = await client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "123456"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["error_code"] == "INVALID_EMAIL_CODE"

    confirmed = await client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "482190"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["email"] == "new@example.com"

    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert old_login.status_code == 401
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "new@example.com", "password": SIGNUP_PAYLOAD["password"]},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_email_change_omits_code_outside_local(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: "482190")
    monkeypatch.setattr(
        "app.features.auth.router.get_settings",
        lambda: type("Settings", (), {"ENVIRONMENT": "production"})(),
    )
    tokens = await _sign_up_and_login(client)

    sent = await client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "new@example.com"},
    )
    assert sent.status_code == 200
    assert sent.json() == {"sent": True}
    assert "482190" not in sent.text

    confirmed = await client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "482190"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_email_change_rejects_same_and_taken_email(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)
    await client.post(
        "/api/v1/auth/signup",
        json={"email": "taken@example.com", "password": "supersecret", "full_name": "다른사람"},
    )

    same = await client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": SIGNUP_PAYLOAD["email"]},
    )
    assert same.status_code == 422
    assert same.json()["error_code"] == "SAME_EMAIL"

    taken = await client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "taken@example.com"},
    )
    assert taken.status_code == 409
    assert taken.json()["error_code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_delete_me_removes_user_and_owned_meals_and_suggestions(client: AsyncClient) -> None:
    signup = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    user_id = signup.json()["id"]
    tokens = (
        await client.post(
            "/api/v1/auth/login",
            json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
        )
    ).json()

    meal = await client.put(
        "/api/v1/meals",
        headers=_auth_header(tokens),
        json={
            "meal_date": "2026-10-20",
            "meal_type": "lunch",
            "setting": "home",
            "foods": [{"id": "1", "name": "감자", "ingredients": []}],
        },
    )
    assert meal.status_code == 200
    meal_id = meal.json()["id"]
    reviewed = await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=_auth_header(tokens),
        json={
            "food_results": [
                {"food_id": "1", "outcome": "eaten", "difficulties": [], "ingredient_outcomes": []}
            ]
        },
    )
    assert reviewed.status_code == 200
    async for session in app.dependency_overrides[get_session]():
        session.add(
            UserSuggestion(
                user_id=int(user_id),
                meal_id=int(meal_id),
                food_id=1,
                food_snapshot=reviewed.json()["food_results"][0]["food_snapshot"],
                what_to_try="작게 제공",
                why_this_may_help="익숙한 형태",
                status="saved",
                saved_at=now_kst(),
            )
        )

    deleted = await client.delete("/api/v1/auth/me", headers=_auth_header(tokens))
    assert deleted.status_code == 204

    me = await client.get("/api/v1/auth/me", headers=_auth_header(tokens))
    assert me.status_code == 401

    leftover = await client.get(f"/api/v1/meals/{meal_id}", headers=_auth_header(tokens))
    assert leftover.status_code == 401
    async for session in app.dependency_overrides[get_session]():
        assert (await session.scalars(select(Meal))).all() == []
        assert (await session.scalars(select(ReviewFoodResult))).all() == []
        assert (await session.scalars(select(UserSuggestion))).all() == []

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login.status_code == 401


@pytest.mark.asyncio
async def test_refresh_issues_new_access_token(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 200
    renewed = response.json()
    assert renewed["token_type"] == "bearer"
    assert decode_token(renewed["access_token"])["type"] == "access"
    assert decode_token(renewed["refresh_token"])["type"] == "refresh"
    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {renewed['access_token']}"}
    )
    assert me.status_code == 200


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(client)
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]}
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_REFRESH_TOKEN"
