# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
# Changed: 마이페이지·자녀 프로필 추가
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 계정 삭제·이메일 변경 테스트를 새 ORM 구조에 맞춤
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

"""회원가입 / 로그인 happy-path + 주요 에러 케이스."""

from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import get_session
from app.core.timezone import now_kst
from app.features.auth.security import create_access_token, decode_token
from app.main import app
from app.models import (
    FoodRecommendation,
    FoodRecommendationTry,
    Meal,
    MealFood,
    MealFoodIngredient,
    User,
    UserConsent,
    UserEmailChangeAttempt,
    UserProfile,
    UserProfileSafeFood,
)
from app.models.food_recommendation_enums import FoodRecommendationStatus
from app.models.meal_enums import EatingOutcome, MealCookingMethod, MealSetting, MealType
from app.models.user_consent_enums import UserConsentKind
from app.models.user_profile_enums import AgeGroup

SIGNUP_PAYLOAD = {
    "email": "user@example.com",
    "password": "supersecret",
    "full_name": "홍길동",
}


@pytest.mark.asyncio
async def test_signup_creates_user(api_client: AsyncClient) -> None:
    res = await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    assert res.status_code == 201
    body = res.json()
    assert body["email"] == SIGNUP_PAYLOAD["email"]
    assert body["full_name"] == SIGNUP_PAYLOAD["full_name"]
    assert isinstance(body["id"], str) and body["id"].isdecimal() and int(body["id"]) > 0
    assert "created_at" in body
    assert "password" not in body  # 비밀번호는 응답에 노출되지 않음
    assert "hashed_password" not in body


@pytest.mark.asyncio
async def test_signup_duplicate_email_conflict(api_client: AsyncClient) -> None:
    await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    res = await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    assert res.status_code == 409
    assert res.json() == {
        "error_code": "EMAIL_ALREADY_EXISTS",
        "details": {"email": SIGNUP_PAYLOAD["email"]},
    }


@pytest.mark.asyncio
async def test_email_identity_is_case_insensitive(api_client: AsyncClient) -> None:
    await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    duplicate = await api_client.post(
        "/api/v1/auth/signup",
        json={**SIGNUP_PAYLOAD, "email": "USER@example.com"},
    )
    assert duplicate.status_code == 409
    login = await api_client.post(
        "/api/v1/auth/login",
        json={"email": "USER@example.com", "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_signup_short_password_rejected(api_client: AsyncClient) -> None:
    res = await api_client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "password": "short"})

    assert res.status_code == 422
    # 비밀번호는 응답에 되돌려 주지 않는다.
    assert res.json() == {"error_code": "INVALID_PASSWORD_LENGTH", "details": {}}


@pytest.mark.asyncio
async def test_signup_invalid_email_rejected(api_client: AsyncClient) -> None:
    res = await api_client.post(
        "/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "email": "not-an-email"}
    )

    assert res.status_code == 422
    assert res.json() == {"error_code": "INVALID_EMAIL", "details": {"input": "not-an-email"}}


@pytest.mark.asyncio
async def test_signup_empty_full_name_rejected(api_client: AsyncClient) -> None:
    res = await api_client.post("/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "full_name": ""})

    assert res.status_code == 422
    assert res.json() == {"error_code": "INVALID_FULL_NAME_LENGTH", "details": {"input": ""}}


@pytest.mark.asyncio
async def test_signup_whitespace_full_name_rejected(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/api/v1/auth/signup", json={**SIGNUP_PAYLOAD, "full_name": "   "}
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_FULL_NAME_LENGTH"


@pytest.mark.asyncio
async def test_signup_missing_field_is_validation_error(api_client: AsyncClient) -> None:
    res = await api_client.post("/api/v1/auth/signup", json={"email": SIGNUP_PAYLOAD["email"]})

    assert res.status_code == 422
    body = res.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert {"loc": ["body", "password"], "type": "missing"} in body["details"]["fields"]


@pytest.mark.asyncio
async def test_login_returns_tokens(api_client: AsyncClient) -> None:
    signup = await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    res = await api_client.post(
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
async def test_login_wrong_password_unauthorized(api_client: AsyncClient) -> None:
    await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)

    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": "wrong-password"},
    )

    assert res.status_code == 401
    assert res.json() == {"error_code": "INVALID_CREDENTIALS", "details": {}}


async def _sign_up_and_login(api_client: AsyncClient) -> dict:
    await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    return res.json()


@pytest.mark.asyncio
async def test_me_returns_current_user(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)

    res = await api_client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )

    assert res.status_code == 200
    assert res.json()["email"] == SIGNUP_PAYLOAD["email"]


@pytest.mark.asyncio
async def test_me_without_token_unauthorized(api_client: AsyncClient) -> None:
    res = await api_client.get("/api/v1/auth/me")

    assert res.status_code == 401
    assert res.json() == {"error_code": "UNAUTHENTICATED", "details": {}}


@pytest.mark.asyncio
async def test_me_documents_unauthenticated_response(api_client: AsyncClient) -> None:
    # get_current_user 가 들고 있는 에러 선언이 /docs 에 자동으로 나타난다.
    schema = (await api_client.get("/openapi.json")).json()
    responses = schema["paths"]["/api/v1/auth/me"]["get"]["responses"]

    assert responses["401"]["description"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_me_with_invalid_token_unauthorized(api_client: AsyncClient) -> None:
    res = await api_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"})

    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "subject", ["3fa85f64-5717-4562-b3fc-2c963f66afa6", "0", "01", "9223372036854775808"]
)
async def test_me_rejects_non_bigint_token_subject(api_client: AsyncClient, subject: str) -> None:
    token = create_access_token(subject)
    res = await api_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_me_rejects_refresh_token(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)

    res = await api_client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )

    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_login_unknown_email_unauthorized(api_client: AsyncClient) -> None:
    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "supersecret"},
    )

    # 존재하지 않는 이메일도 비밀번호 오류와 동일하게 응답한다.
    assert res.status_code == 401
    assert res.json()["error_code"] == "INVALID_CREDENTIALS"


def _auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_patch_me_updates_full_name(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)

    res = await api_client.patch(
        "/api/v1/auth/me",
        headers=_auth_header(tokens),
        json={"full_name": "김도연"},
    )

    assert res.status_code == 200
    assert res.json()["full_name"] == "김도연"
    me = await api_client.get("/api/v1/auth/me", headers=_auth_header(tokens))
    assert me.json()["full_name"] == "김도연"


@pytest.mark.asyncio
async def test_email_change_requires_server_code(
    api_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: "482190")
    tokens = await _sign_up_and_login(api_client)

    sent = await api_client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "new@example.com"},
    )
    assert sent.status_code == 200
    assert sent.json() == {"sent": True, "dev_code": "482190"}

    wrong = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "123456"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["error_code"] == "INVALID_EMAIL_CODE"

    confirmed = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "482190"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["email"] == "new@example.com"

    old_login = await api_client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert old_login.status_code == 401
    new_login = await api_client.post(
        "/api/v1/auth/login",
        json={"email": "new@example.com", "password": SIGNUP_PAYLOAD["password"]},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_email_change_keeps_one_attempt_and_clears_it_on_confirm(
    api_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    codes = iter(["111111", "222222"])
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: next(codes))
    tokens = await _sign_up_and_login(api_client)

    for email in ("first@example.com", "second@example.com"):
        sent = await api_client.post(
            "/api/v1/auth/email-change", headers=_auth_header(tokens), json={"email": email}
        )
        assert sent.status_code == 200

    # 새 요청은 이전 시도를 덮어쓰므로 시도는 하나뿐이고 마지막 요청의 값이다.
    async for session in app.dependency_overrides[get_session]():
        attempts = (await session.scalars(select(UserEmailChangeAttempt))).all()
        assert [a.new_email for a in attempts] == ["second@example.com"]

    stale = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "first@example.com", "code": "111111"},
    )
    assert stale.status_code == 400
    assert stale.json()["error_code"] == "INVALID_EMAIL_CODE"

    confirmed = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "second@example.com", "code": "222222"},
    )
    assert confirmed.status_code == 200

    # 확인에 성공하면 시도 행이 삭제된다.
    async for session in app.dependency_overrides[get_session]():
        assert (await session.scalars(select(UserEmailChangeAttempt))).all() == []


@pytest.mark.asyncio
async def test_email_change_rejects_expired_code(
    api_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: "482190")
    tokens = await _sign_up_and_login(api_client)
    await api_client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "new@example.com"},
    )

    async for session in app.dependency_overrides[get_session]():
        attempt = (await session.scalars(select(UserEmailChangeAttempt))).one()
        attempt.expires_at = now_kst() - timedelta(minutes=1)

    expired = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "482190"},
    )
    assert expired.status_code == 400
    assert expired.json()["error_code"] == "INVALID_EMAIL_CODE"


@pytest.mark.asyncio
async def test_email_change_omits_code_outside_local(
    api_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.features.auth.service.issue_email_code", lambda: "482190")
    monkeypatch.setattr(
        "app.features.auth.router.get_settings",
        lambda: type("Settings", (), {"ENVIRONMENT": "production"})(),
    )
    tokens = await _sign_up_and_login(api_client)

    sent = await api_client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "new@example.com"},
    )
    assert sent.status_code == 200
    assert sent.json() == {"sent": True}
    assert "482190" not in sent.text

    confirmed = await api_client.post(
        "/api/v1/auth/email-change/confirm",
        headers=_auth_header(tokens),
        json={"email": "new@example.com", "code": "482190"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_email_change_rejects_same_and_taken_email(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)
    await api_client.post(
        "/api/v1/auth/signup",
        json={"email": "taken@example.com", "password": "supersecret", "full_name": "다른사람"},
    )

    same = await api_client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": SIGNUP_PAYLOAD["email"]},
    )
    assert same.status_code == 422
    assert same.json()["error_code"] == "SAME_EMAIL"

    taken = await api_client.post(
        "/api/v1/auth/email-change",
        headers=_auth_header(tokens),
        json={"email": "taken@example.com"},
    )
    assert taken.status_code == 409
    assert taken.json()["error_code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_delete_me_removes_user_and_all_owned_rows(api_client: AsyncClient) -> None:
    signup = await api_client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    user_id = int(signup.json()["id"])
    tokens = (
        await api_client.post(
            "/api/v1/auth/login",
            json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
        )
    ).json()

    # 계정이 소유하는 모든 테이블에 행을 하나씩 만든다.
    async for session in app.dependency_overrides[get_session]():
        meal = Meal(
            user_id=user_id,
            meal_date=date(2026, 10, 20),
            meal_type=MealType.LUNCH,
            setting=MealSetting.HOME,
            saved_at=now_kst(),
        )
        session.add(meal)
        await session.flush()
        food = MealFood(
            meal_id=meal.id,
            name="감자",
            cooking_method=MealCookingMethod.STEAMED,
            outcome=EatingOutcome.EATEN,
            difficulty_reasons=["COLOR.WHITE"],
        )
        session.add(food)
        await session.flush()
        session.add(
            MealFoodIngredient(meal_food_id=food.id, name="감자", outcome=EatingOutcome.EATEN)
        )
        recommendation = FoodRecommendation(
            user_id=user_id,
            origin_food_id=food.id,
            what_to_try="작게 제공",
            why_this_may_help="익숙한 형태",
            ingredients=["감자"],
            cooking_method=MealCookingMethod.STEAMED,
            causes="흰색 음식이 익숙하다",
            status=FoodRecommendationStatus.TRIED,
            saved_at=now_kst(),
        )
        session.add(recommendation)
        await session.flush()
        session.add(
            FoodRecommendationTry(food_recommendation_id=recommendation.id, food_id=food.id)
        )
        session.add(
            UserProfile(
                user_id=user_id,
                child_name="아이",
                age_group=AgeGroup.AGE_4_5,
                restrictions=["ALLERGY.NONE"],
            )
        )
        await session.flush()
        session.add(UserProfileSafeFood(user_id=user_id, name="밥", preparation="흰쌀밥"))
        session.add(
            UserConsent(
                user_id=user_id,
                kind=UserConsentKind.ACCOUNT_PRIVACY,
                granted=True,
                document_version="v1",
            )
        )
        session.add(
            UserEmailChangeAttempt(
                user_id=user_id,
                new_email="new@example.com",
                code_hash="hash",
                expires_at=now_kst() + timedelta(minutes=10),
            )
        )

    deleted = await api_client.delete("/api/v1/auth/me", headers=_auth_header(tokens))
    assert deleted.status_code == 204

    me = await api_client.get("/api/v1/auth/me", headers=_auth_header(tokens))
    assert me.status_code == 401

    async for session in app.dependency_overrides[get_session]():
        for model in (
            User,
            Meal,
            MealFood,
            MealFoodIngredient,
            FoodRecommendation,
            FoodRecommendationTry,
            UserProfile,
            UserProfileSafeFood,
            UserConsent,
            UserEmailChangeAttempt,
        ):
            assert (await session.scalars(select(model))).all() == [], model.__name__

    login = await api_client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP_PAYLOAD["email"], "password": SIGNUP_PAYLOAD["password"]},
    )
    assert login.status_code == 401


@pytest.mark.asyncio
async def test_refresh_issues_new_access_token(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)
    response = await api_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 200
    renewed = response.json()
    assert renewed["token_type"] == "bearer"
    assert decode_token(renewed["access_token"])["type"] == "access"
    assert decode_token(renewed["refresh_token"])["type"] == "refresh"
    me = await api_client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {renewed['access_token']}"}
    )
    assert me.status_code == 200


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(api_client: AsyncClient) -> None:
    tokens = await _sign_up_and_login(api_client)
    response = await api_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]}
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_REFRESH_TOKEN"
