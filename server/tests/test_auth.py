# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""회원가입 / 로그인 happy-path + 주요 에러 케이스."""

import pytest
from httpx import AsyncClient

from tests.test_meal_logs import put_meal

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
    assert "id" in body
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
async def test_signup_missing_field_is_validation_error(client: AsyncClient) -> None:
    res = await client.post("/api/v1/auth/signup", json={"email": SIGNUP_PAYLOAD["email"]})

    assert res.status_code == 422
    body = res.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert {"loc": ["body", "password"], "type": "missing"} in body["details"]["fields"]


@pytest.mark.asyncio
async def test_login_returns_tokens(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]


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


# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
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
    assert sent.json() == {"sent": True}
    assert "482190" not in sent.text

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
async def test_delete_me_removes_user_and_child_meals(client: AsyncClient) -> None:
    signup = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    user_id = signup.json()["id"]
    tokens = (
        await client.post(
            "/api/v1/auth/login",
            json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
        )
    ).json()

    meal = await put_meal(client, child_id=user_id, meal_id="meal-to-wipe")
    assert meal.status_code == 200

    deleted = await client.delete("/api/v1/auth/me", headers=_auth_header(tokens))
    assert deleted.status_code == 204

    me = await client.get("/api/v1/auth/me", headers=_auth_header(tokens))
    assert me.status_code == 401

    leftover = await client.get(f"/api/v1/children/{user_id}/meals/meal-to-wipe")
    assert leftover.status_code == 404

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login.status_code == 401
