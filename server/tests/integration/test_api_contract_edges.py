# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: 거부 음식 테이블 계약 반영
# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Register separate check-in ingredient storage in the schema contract
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 테이블 목록, 식사 헬퍼, 음식 단위 추천·프로필 제한·시도 상태 계약으로 변경
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 추가 추천 테이블과 Eaten 제외에 맞춘 생성 대상

# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 영어 추천 fixture와 공용 재료 적재 상태 테이블 계약
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 홈 화면 추천 생성 API의 실패 원자성·응답 필드·프로필 계약으로 변경

"""Contract edge cases for authenticated meals, reviews, and suggestions."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import Base
from app.core.timezone import now_kst
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.main import app
from app.models.ingredient_enums import RestrictionDegree
from tests.fixtures.reviews import review_payload
from tests.helpers.auth import auth_headers as login
from tests.helpers.suggestions import (
    PROFILE_RESTRICTIONS,
    batch,
    install_model,
    request_suggestions,
    save_profile,
    seed_ingredient,
    stored_suggestion_names,
)

SUGGESTIONS = "/api/v1/suggestions"


def test_only_current_tables_and_routes_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "ingredients",
        "ingredient_restrictions",
        "ingredient_catalog_state",
        "meals",
        "meal_foods",
        "meal_food_ingredients",
        "food_recommendations",
        "food_recommendation_tries",
        "food_recommendation_retries",
        "users",
        "user_email_change_attempts",
        "user_profiles",
        "user_profile_refused_foods",
        "user_consents",
    }
    assert not any(path.startswith("/api/v1/children/") for path in app.openapi()["paths"])


async def save_meal(
    api_client: AsyncClient,
    headers: dict[str, str],
    meal_date: str,
    *,
    ingredient: bool = False,
) -> str:
    response = await api_client.put(
        "/api/v1/meals",
        headers=headers,
        json={
            "meal_date": meal_date,
            "meal_type": "LUNCH",
            "setting": "HOME",
            "before_photo_uri": "before.jpg",
            "foods": [
                {
                    "name": "감자",
                    "ingredients": [{"name": "감자"}] if ingredient else [],
                }
            ],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["id"]


async def review_meal(
    api_client: AsyncClient,
    headers: dict[str, str],
    meal_id: str,
    *,
    food_id: str | None = None,
    outcome: str = "TASTED",
) -> object:
    if food_id is None:
        # 음식 id 는 서버가 발급하므로 저장된 식사에서 찾는다. 남의 식사면 404 가 그대로 돌아온다.
        detail = await api_client.get(f"/api/v1/meals/{meal_id}", headers=headers)
        if detail.status_code != 200:
            return detail
        food_id = detail.json()["foods"][0]["id"]
    return await api_client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json=review_payload(food_id=food_id, outcome=outcome),
    )


@pytest.mark.asyncio
async def test_meal_history_review_replacement_and_ownership(api_client: AsyncClient) -> None:
    owner = await login(api_client, "owner@example.com")
    other = await login(api_client, "other@example.com")
    older = await save_meal(api_client, owner, "2026-10-19")
    newer = await save_meal(api_client, owner, "2026-10-20")
    await save_meal(api_client, other, "2026-10-21")
    assert [row["id"] for row in (await api_client.get("/api/v1/meals", headers=owner)).json()] == [
        newer,
        older,
    ]
    assert (await api_client.get(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(api_client, other, older)).status_code == 404
    assert (await api_client.delete(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(api_client, owner, older, food_id="999")).status_code == 422
    first = await review_meal(api_client, owner, older, outcome="EATEN")
    assert first.status_code == 200, first.text
    replaced = await review_meal(api_client, owner, older, outcome="TASTED")
    assert replaced.status_code == 200, replaced.text
    detail = (await api_client.get(f"/api/v1/meals/{older}", headers=owner)).json()
    assert detail["before_photo_uri"] == "before.jpg"
    assert detail["after_photo_uri"] == "after.jpg"
    assert [food["outcome"] for food in detail["foods"]] == ["TASTED"]
    assert "review" not in detail


@pytest.mark.asyncio
async def test_home_generation_failure_is_atomic_and_the_response_has_only_home_fields(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    meal_id = await save_meal(api_client, owner, "2026-10-20", ingredient=True)
    assert (await review_meal(api_client, owner, meal_id)).status_code == 200
    assert (await api_client.post(SUGGESTIONS)).status_code == 401
    # 식사 기준 생성·조회 경로는 없다.
    for method in ("GET", "POST"):
        removed = await api_client.request(
            method, f"/api/v1/meals/{meal_id}/suggestions", headers=owner
        )
        assert removed.status_code in (404, 405), method

    # 요청한 개수를 끝내 채우지 못하면 하나도 저장하지 않는다.
    model = install_model(monkeypatch, [batch("Rice porridge")] * MAX_ATTEMPTS)
    failed = await api_client.post(SUGGESTIONS, headers=owner)
    assert failed.status_code == 502
    assert failed.json()["error_code"] == "GENERATION_FAILED"
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert await stored_suggestion_names() == []

    install_model(monkeypatch, [batch()])
    created = await request_suggestions(api_client, owner)
    assert [item["what_to_try"] for item in created] == ["Rice porridge", "Rice ball", "Rice cake"]
    for item in created:
        assert set(item) == {
            "id",
            "user_id",
            "what_to_try",
            "why_this_may_help",
            "ingredients",
            "preparation_method",
            "status",
            "dismiss_reasons",
            "saved_at",
            "created_at",
        }
        assert item["status"] == "PENDING" and item["dismiss_reasons"] == []
        assert item["ingredients"] == ["Rice"] and item["preparation_method"]
    assert await stored_suggestion_names() == ["Rice porridge", "Rice ball", "Rice cake"]


@pytest.mark.asyncio
async def test_generation_needs_a_profile_and_only_uses_ingredients_judged_safe(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(api_client, "owner@example.com")

    # 프로필이 없으면 아이의 제한과 연령대를 알 수 없어 만들지 않는다.
    model = install_model(monkeypatch, [batch()])
    missing = await api_client.post(SUGGESTIONS, headers=owner)
    assert missing.status_code == 409
    assert missing.json()["error_code"] == "PROFILE_REQUIRED"
    assert model.compose_inputs == []

    # 제한 하나에 NEVER 가 아닌 판정만 있는 재료는 쓸 수 없으므로 생성이 끝내 실패한다.
    await save_profile(api_client, owner)
    judgements = dict.fromkeys(PROFILE_RESTRICTIONS, RestrictionDegree.NEVER)
    judgements[PROFILE_RESTRICTIONS[0]] = RestrictionDegree.DEPENDS_ON_PRODUCT
    await seed_ingredient("Rice", judgements)
    model = install_model(monkeypatch, [batch()] * MAX_ATTEMPTS)
    rejected = await api_client.post(SUGGESTIONS, headers=owner)
    assert rejected.status_code == 502
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert await stored_suggestion_names() == []


@pytest.mark.asyncio
async def test_saved_filter_decision_validation_and_undo(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(api_client, "owner@example.com")
    other = await login(api_client, "other@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")

    install_model(monkeypatch, [batch()])
    suggestion_id = (await request_suggestions(api_client, owner))[0]["id"]
    decision = f"/api/v1/suggestions/{suggestion_id}/decision"
    for body in (
        {"status": "DISMISSED", "dismiss_reasons": []},
        {"status": "SAVED", "dismiss_reasons": ["ALREADY_TRIED"]},
        {"status": "DISMISSED", "dismiss_reasons": ["already_tried"]},
        {"status": "DISMISSED", "dismiss_reasons": ["ALREADY_TRIED", "ALREADY_TRIED"]},
        {"status": "saved", "dismiss_reasons": []},
        {"status": "TRIED", "dismiss_reasons": []},
    ):
        assert (await api_client.put(decision, headers=owner, json=body)).status_code == 422, body
    assert (
        await api_client.put(
            decision, headers=other, json={"status": "SAVED", "dismiss_reasons": []}
        )
    ).status_code == 404
    saved = await api_client.put(
        decision, headers=owner, json={"status": "SAVED", "dismiss_reasons": []}
    )
    assert saved.status_code == 200
    assert saved.json()["status"] == "SAVED" and saved.json()["saved_at"] is not None
    yesterday = (now_kst().date() - timedelta(days=1)).isoformat()
    today = now_kst().date().isoformat()
    after_yesterday = await api_client.get(
        "/api/v1/suggestions", headers=owner, params={"after_meal_date": yesterday}
    )
    assert len(after_yesterday.json()) == 1
    after_today = await api_client.get(
        "/api/v1/suggestions", headers=owner, params={"after_meal_date": today}
    )
    assert after_today.json() == []
    dismissed = await api_client.put(
        decision,
        headers=owner,
        json={"status": "DISMISSED", "dismiss_reasons": ["TOO_MUCH_PREPARATION"]},
    )
    assert dismissed.json()["dismiss_reasons"] == ["TOO_MUCH_PREPARATION"]
    assert dismissed.json()["saved_at"] is None
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
    assert (await api_client.delete(decision, headers=owner)).json()["status"] == "PENDING"
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
