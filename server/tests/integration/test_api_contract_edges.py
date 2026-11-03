# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Register separate check-in ingredient storage in the schema contract
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 테이블 목록, 식사 헬퍼, 음식 단위 추천·프로필 제한·시도 상태 계약으로 변경
"""Contract edge cases for authenticated meals, reviews, and suggestions."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.database import Base
from app.core.timezone import now_kst
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.main import app
from app.models.ingredient_enums import RestrictionDegree
from tests.helpers.auth import auth_headers as login
from tests.helpers.suggestions import (
    PROFILE_RESTRICTIONS,
    batch,
    install_model,
    save_profile,
    seed_ingredient,
)


def test_only_current_tables_and_routes_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "ingredients",
        "ingredient_restrictions",
        "meals",
        "meal_foods",
        "meal_food_ingredients",
        "food_recommendations",
        "food_recommendation_tries",
        "users",
        "user_email_change_attempts",
        "user_profiles",
        "user_profile_safe_foods",
        "user_consents",
    }
    assert not any(path.startswith("/api/v1/children/") for path in app.openapi()["paths"])


async def save_meal(
    client: AsyncClient,
    headers: dict[str, str],
    meal_date: str,
    *,
    ingredient: bool = False,
) -> str:
    response = await client.put(
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


async def first_food_id(client: AsyncClient, headers: dict[str, str], meal_id: str) -> str:
    detail = await client.get(f"/api/v1/meals/{meal_id}", headers=headers)
    return detail.json()["foods"][0]["id"]


async def review_meal(
    client: AsyncClient,
    headers: dict[str, str],
    meal_id: str,
    *,
    food_id: str | None = None,
    outcome: str = "EATEN",
) -> object:
    if food_id is None:
        # 음식 id 는 서버가 발급하므로 저장된 식사에서 찾는다. 남의 식사면 404 가 그대로 돌아온다.
        detail = await client.get(f"/api/v1/meals/{meal_id}", headers=headers)
        if detail.status_code != 200:
            return detail
        food_id = detail.json()["foods"][0]["id"]
    return await client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=headers,
        json={
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": food_id,
                    "outcome": outcome,
                    "difficulty_reasons": ["TEXTURE.HARDNESS.SOFT"],
                    "ingredient_outcomes": [],
                }
            ],
        },
    )


@pytest.mark.asyncio
async def test_meal_history_review_replacement_and_ownership(client: AsyncClient) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    older = await save_meal(client, owner, "2026-10-19")
    newer = await save_meal(client, owner, "2026-10-20")
    await save_meal(client, other, "2026-10-21")
    assert [row["id"] for row in (await client.get("/api/v1/meals", headers=owner)).json()] == [
        newer,
        older,
    ]
    assert (await client.get(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(client, other, older)).status_code == 404
    assert (await client.delete(f"/api/v1/meals/{older}", headers=other)).status_code == 404
    assert (await review_meal(client, owner, older, food_id="999")).status_code == 422
    first = await review_meal(client, owner, older, outcome="EATEN")
    assert first.status_code == 200, first.text
    replaced = await review_meal(client, owner, older, outcome="TASTED")
    assert replaced.status_code == 200, replaced.text
    detail = (await client.get(f"/api/v1/meals/{older}", headers=owner)).json()
    assert detail["before_photo_uri"] == "before.jpg"
    assert detail["after_photo_uri"] == "after.jpg"
    assert [food["outcome"] for food in detail["foods"]] == ["TASTED"]
    assert "review" not in detail


@pytest.mark.asyncio
async def test_suggestion_target_validation_and_generation_failure_are_atomic(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    await save_profile(client, owner)
    await seed_ingredient("쌀")
    meal_id = await save_meal(client, owner, "2026-10-20", ingredient=True)
    food_id = await first_food_id(client, owner, meal_id)
    path = f"/api/v1/meals/{meal_id}/suggestions"
    target = {"food_id": food_id}
    unreviewed = await client.post(path, headers=owner, json={"targets": [target]})
    assert unreviewed.status_code == 409
    assert unreviewed.json()["error_code"] == "REVIEW_REQUIRED"
    assert (await review_meal(client, owner, meal_id)).status_code == 200
    assert (await client.post(path, headers=other, json={"targets": [target]})).status_code == 404
    assert (await client.post(path, headers=owner, json={"targets": []})).status_code == 422
    assert (
        await client.post(path, headers=owner, json={"targets": [target, target]})
    ).status_code == 422
    # 추천은 음식 단위라 재료 id 를 보낼 수 없고, 이 식사에 없는 음식도 거절한다.
    with_ingredient = {"targets": [{"food_id": food_id, "ingredient_id": "1"}]}
    assert (await client.post(path, headers=owner, json=with_ingredient)).status_code == 422
    unknown = await client.post(path, headers=owner, json={"targets": [{"food_id": "999"}]})
    assert unknown.status_code == 422
    assert unknown.json()["error_code"] == "INVALID_SUGGESTION_TARGET"

    model = install_model(monkeypatch, [batch()] * MAX_ATTEMPTS)
    failed = await client.post(path, headers=owner, json={"targets": [target]})
    assert failed.status_code == 502
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert (await client.get(f"{path}?status=ALL", headers=owner)).json() == []
    install_model(monkeypatch, [batch("0")])
    retried = await client.post(path, headers=owner, json={"targets": [target]})
    assert retried.status_code == 201, retried.text
    created = retried.json()[0]
    assert created["status"] == "PENDING" and created["origin_food_id"] == food_id
    assert created["meal_id"] == meal_id
    assert created["ingredients"] == ["쌀"] and created["cooking_method"] == "STEAMED"
    assert created["causes"]
    assert len((await client.get(f"{path}?status=ALL", headers=owner)).json()) == 1


@pytest.mark.asyncio
async def test_generation_needs_a_profile_and_only_uses_ingredients_judged_safe(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    meal_id = await save_meal(client, owner, "2026-10-20")
    assert (await review_meal(client, owner, meal_id)).status_code == 200
    path = f"/api/v1/meals/{meal_id}/suggestions"
    body = {"targets": [{"food_id": await first_food_id(client, owner, meal_id)}]}

    # 프로필이 없으면 아이의 제한을 알 수 없어 만들지 않는다.
    install_model(monkeypatch, [batch("0")])
    missing = await client.post(path, headers=owner, json=body)
    assert missing.status_code == 409
    assert missing.json()["error_code"] == "PROFILE_REQUIRED"

    # 제한 하나에 NEVER 가 아닌 판정만 있는 재료는 쓸 수 없으므로 생성이 끝내 실패한다.
    await save_profile(client, owner)
    judgements = dict.fromkeys(PROFILE_RESTRICTIONS, RestrictionDegree.NEVER)
    judgements[PROFILE_RESTRICTIONS[0]] = RestrictionDegree.DEPENDS_ON_PRODUCT
    await seed_ingredient("쌀", judgements)
    model = install_model(monkeypatch, [batch("0")] * MAX_ATTEMPTS)
    rejected = await client.post(path, headers=owner, json=body)
    assert rejected.status_code == 502
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert (await client.get(f"{path}?status=ALL", headers=owner)).json() == []


@pytest.mark.asyncio
async def test_saved_filter_decision_validation_and_undo(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    await save_profile(client, owner)
    await seed_ingredient("쌀")
    meal_id = await save_meal(client, owner, "2026-10-20")
    assert (await review_meal(client, owner, meal_id)).status_code == 200

    install_model(monkeypatch, [batch("0")])
    created = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=owner,
        json={"targets": [{"food_id": await first_food_id(client, owner, meal_id)}]},
    )
    assert created.status_code == 201, created.text
    suggestion_id = created.json()[0]["id"]
    decision = f"/api/v1/suggestions/{suggestion_id}/decision"
    for body in (
        {"status": "DISMISSED", "dismiss_reasons": []},
        {"status": "SAVED", "dismiss_reasons": ["ALREADY_TRIED"]},
        {"status": "DISMISSED", "dismiss_reasons": ["already_tried"]},
        {"status": "DISMISSED", "dismiss_reasons": ["ALREADY_TRIED", "ALREADY_TRIED"]},
        {"status": "saved", "dismiss_reasons": []},
        {"status": "TRIED", "dismiss_reasons": []},
    ):
        assert (await client.put(decision, headers=owner, json=body)).status_code == 422, body
    assert (
        await client.put(decision, headers=other, json={"status": "SAVED", "dismiss_reasons": []})
    ).status_code == 404
    saved = await client.put(
        decision, headers=owner, json={"status": "SAVED", "dismiss_reasons": []}
    )
    assert saved.status_code == 200
    assert saved.json()["status"] == "SAVED" and saved.json()["saved_at"] is not None
    yesterday = (now_kst().date() - timedelta(days=1)).isoformat()
    today = now_kst().date().isoformat()
    after_yesterday = await client.get(
        "/api/v1/suggestions", headers=owner, params={"after_meal_date": yesterday}
    )
    assert len(after_yesterday.json()) == 1
    after_today = await client.get(
        "/api/v1/suggestions", headers=owner, params={"after_meal_date": today}
    )
    assert after_today.json() == []
    dismissed = await client.put(
        decision,
        headers=owner,
        json={"status": "DISMISSED", "dismiss_reasons": ["TOO_MUCH_PREPARATION"]},
    )
    assert dismissed.json()["dismiss_reasons"] == ["TOO_MUCH_PREPARATION"]
    assert dismissed.json()["saved_at"] is None
    assert (await client.get("/api/v1/suggestions", headers=owner)).json() == []
    assert (await client.delete(decision, headers=owner)).json()["status"] == "PENDING"
    assert (await client.get("/api/v1/suggestions", headers=owner)).json() == []
    # 목록 필터는 대문자만 받는다.
    bad_filter = await client.get(f"/api/v1/meals/{meal_id}/suggestions?status=all", headers=owner)
    assert bad_filter.status_code == 422
