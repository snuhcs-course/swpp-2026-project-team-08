# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 저장·권한·복구 Integration 예시

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


# 실제 HTTP → 인증 → 서비스 → DB를 실행한다. 공통 client가 DB와 override를 정리한다.
async def test_프로필을_저장하면_다시_조회한_결과에_반영된다(api_client):
    # 준비: 인증은 helper, 입력 데이터는 fixture로 준비한다.
    headers = await auth_headers(api_client, "parent@example.com")
    body = request_body()
    body["profile"]["child_name"] = "민수"

    # 실행
    saved = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert saved.status_code == 200
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)

    # 검증: 저장 응답뿐 아니라 다른 요청에서 조회한 결과도 확인한다.
    assert loaded.status_code == 200
    assert loaded.json()["profile"]["child_name"] == "민수"
    assert loaded.json() == saved.json()


@pytest.mark.parametrize(
    ("path", "value"),
    [
        pytest.param(("profile", "child_name"), "", id="빈_이름"),
        pytest.param(("profile", "child_name"), "   ", id="공백_이름"),
        pytest.param(("profile", "age_group"), "adult", id="없는_선택지"),
        pytest.param(("profile", "food_preferences", "family_foods"), [], id="필수_목록_없음"),
        pytest.param(
            ("profile", "safety", "allergies", "status"), "none_known", id="상태와_목록_모순"
        ),
        pytest.param(("consents", 2, "granted"), "false", id="boolean_문자열"),
        pytest.param(("consents", 0, "granted"), False, id="필수_동의_거부"),
    ],
)
async def test_잘못된_프로필로_수정하면_기존_내용을_유지한다(api_client, path, value):
    # 준비: 공통 fixture에서 한 조건만 바꾼다. 각 호출은 독립된 객체를 반환한다.
    headers, before = await prepare_profile(api_client)
    body = request_body()
    target = body
    for key in path[:-1]:
        target = target[key]
    target[path[-1]] = value

    # 실행
    rejected = await api_client.put("/api/v1/onboarding", headers=headers, json=body)

    # 검증
    assert rejected.status_code == 422
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json() == before


async def test_저장_중_실패하면_rollback하고_재시도할_수_있다(api_client, monkeypatch):
    # 준비
    headers, before = await prepare_profile(api_client)
    updated = request_body()
    updated["profile"]["child_name"] = "변경한 이름"
    updated["consents"][2]["granted"] = True
    real_flush = AsyncSession.flush

    async def fail_after_flush(session, *args, **kwargs):
        await real_flush(session, *args, **kwargs)
        raise RuntimeError("저장 중 실패")

    # 실행: 실제 DB 쓰기 뒤에만 실패를 주입한다. 서비스·rollback은 대체하지 않는다.
    with monkeypatch.context() as patch:
        patch.setattr(AsyncSession, "flush", fail_after_flush)
        # ASGITransport는 처리되지 않은 앱 예외를 테스트로 전달한다.
        with pytest.raises(RuntimeError, match="저장 중 실패"):
            await api_client.put("/api/v1/onboarding", headers=headers, json=updated)

    # 검증: 프로필과 동의가 함께 보존되어야 한다.
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json() == before

    # 복구: 실패 주입이 해제된 뒤 같은 입력으로 재시도한다.
    retried = await api_client.put("/api/v1/onboarding", headers=headers, json=updated)
    assert retried.status_code == 200
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["profile"]["child_name"] == "변경한 이름"
    consents = loaded.json()["consents"]
    assert next(item for item in consents if item["kind"] == "ai_training")["granted"] is True
    assert len({item["kind"] for item in consents}) == len(consents)


async def test_다른_사용자의_안전_음식을_참조하면_저장하지_않는다(api_client):
    # 준비: 실제 인증으로 서로 다른 소유자를 만든다.
    first_headers, first_profile = await prepare_profile(api_client)
    second_headers = await auth_headers(api_client, "second@example.com")
    body = request_body()
    body["profile"]["safe_foods"]["items"][0]["id"] = first_profile["profile"]["safe_foods"][
        "items"
    ][0]["id"]

    # 실행
    rejected = await api_client.put("/api/v1/onboarding", headers=second_headers, json=body)

    # 검증: 권한 오류와 양쪽 사용자의 저장 결과를 함께 확인한다.
    assert rejected.status_code == 422
    assert rejected.json()["error_code"] == "SAFE_FOOD_NOT_FOUND"
    second = await api_client.get("/api/v1/onboarding", headers=second_headers)
    assert second.status_code == 200
    assert second.json() == {"profile": None, "consents": []}
    first = await api_client.get("/api/v1/onboarding", headers=first_headers)
    assert first.status_code == 200
    assert first.json() == first_profile


async def prepare_profile(api_client):
    """선행 계정·프로필만 준비하고 검사할 행동과 핵심 검증은 본문에 둔다."""
    headers = await auth_headers(api_client, "first@example.com")
    created = await api_client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert created.status_code == 200
    return headers, created.json()


async def test_같은_프로필을_다시_저장해도_기존_항목과_동의를_중복하지_않는다(api_client):
    headers, before = await prepare_profile(api_client)
    body = request_body()
    # 수정 요청에는 서버가 발급한 안전 음식 ID를 포함한다.
    body["profile"]["safe_foods"]["items"][0]["id"] = before["profile"]["safe_foods"]["items"][0][
        "id"
    ]

    repeated = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
    assert repeated.status_code == 200
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)

    assert loaded.status_code == 200
    after = loaded.json()
    assert after == repeated.json()
    # 저장 시각은 갱신되지만 음식 ID·내용과 동의 이력은 그대로 유지한다.
    assert after["profile"]["updated_at"] >= before["profile"]["updated_at"]
    assert {key: value for key, value in after["profile"].items() if key != "updated_at"} == {
        key: value for key, value in before["profile"].items() if key != "updated_at"
    }
    assert after["consents"] == before["consents"]


@pytest.mark.parametrize("method", ["GET", "PUT"], ids=["조회", "저장"])
async def test_인증_없는_요청은_거부하고_기존_프로필을_보존한다(api_client, method):
    headers, before = await prepare_profile(api_client)
    options = {"json": request_body()} if method == "PUT" else {}

    rejected = await api_client.request(method, "/api/v1/onboarding", **options)

    assert rejected.status_code == 401
    assert rejected.json()["error_code"] == "UNAUTHENTICATED"
    loaded = await api_client.get("/api/v1/onboarding", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json() == before
