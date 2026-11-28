# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 저장 목록 제거와 시도 기록 보존 검증
# AI-generated with GPT-6, 2026-11-24, reviewed by Haechan Jung
# Changed: 영어 추천 fixture와 카탈로그·가짜 판정기의 재료명 일치
# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 홈 추천의 저장·결정·목록 제거와 이전 추가 추천의 연결 검증

"""실제 API·SQLite로 보관 해제, 재저장, 권한과 시도 이력을 검증한다."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FoodRecommendation, FoodRecommendationRetry, FoodRecommendationTry
from app.models.food_recommendation_enums import (
    FoodRecommendationFeedback,
    FoodRecommendationStatus,
)
from tests.fixtures.meals import food_payload, meal_payload
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import install_home_generator, save_profile


async def prepare_suggestions(client, monkeypatch):
    owner = await auth_headers(client, "saved-removal@example.com")
    await save_profile(client, owner)
    history = await client.put("/api/v1/meals", headers=owner, json=meal_payload())
    assert history.status_code == 200, history.text
    install_home_generator(monkeypatch)
    items = []
    for _ in range(2):
        card = await client.post("/api/v1/suggestions", headers=owner)
        assert card.status_code == 201, card.text
        items.append(card.json())
    return owner, items


async def save(client, owner, item):
    response = await client.put(
        f"/api/v1/suggestions/{item['id']}/decision",
        headers=owner,
        json={"status": "SAVED", "dismiss_reasons": []},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def record_try(client, owner, item):
    food = food_payload("A small serving")
    food["food_recommendation_ids"] = [item["id"]]
    response = await client.put("/api/v1/meals", headers=owner, json=meal_payload(food))
    assert response.status_code == 200, response.text
    return response.json()


async def test_saved_suggestions_with_and_without_a_source(api_client, session_factory):
    owner = await auth_headers(api_client, "saved-suggestions@example.com")
    meal = (
        await api_client.put(
            "/api/v1/meals", headers=owner, json=meal_payload(food_payload("Rice"))
        )
    ).json()
    source_id = int(meal["foods"][0]["id"])
    async with session_factory.begin() as session:
        cards = [
            FoodRecommendation(
                user_id=int(meal["user_id"]),
                origin_food_id=origin_id,
                food_name=name,
                what_to_try="Serve a small portion",
                why_this_may_help="A familiar texture",
                ingredients=[name],
                cooking_method="STEAMED",
                causes="Texture",
            )
            for origin_id, name in [(source_id, "Rice"), (source_id, "Soft rice"), (None, "Potato")]
        ]
        session.add_all(cards)
        await session.flush()
        original, replacement, home = cards
        original.status = FoodRecommendationStatus.DISMISSED
        session.add(
            FoodRecommendationRetry(
                food_id=source_id, dismissed_id=original.id, replacement_id=replacement.id
            )
        )
        original_id, legacy_id, home_id = [str(card.id) for card in cards]

    assert (await save(api_client, owner, {"id": legacy_id}))["replacement_for_id"] == original_id
    await save(api_client, owner, {"id": home_id})
    listed = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    assert [
        (row["id"], row["food_name"], row["meal_id"], row["origin_food_id"]) for row in listed
    ] == [
        (home_id, "Potato", None, None),
        (legacy_id, "Soft rice", meal["id"], str(source_id)),
    ]

    assert [row["replacement_for_id"] for row in listed] == [None, original_id]
    path = f"/api/v1/suggestions/{home_id}"
    stranger = await auth_headers(api_client, "other-suggestions@example.com")
    assert (await api_client.delete(path + "/saved", headers=stranger)).status_code == 404
    assert (await api_client.delete(path + "/saved", headers=owner)).status_code == 204
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == listed[1:]
    dismissed = await api_client.put(
        path + "/decision",
        headers=owner,
        json={"status": "DISMISSED", "dismiss_reasons": ["DISLIKE"]},
    )
    assert dismissed.json()["dismiss_reasons"] == ["DISLIKE"]
    undone = await api_client.delete(path + "/decision", headers=owner)
    assert undone.json()["status"] == "PENDING"
    assert undone.json()["dismiss_reasons"] == []
    async with session_factory() as session:
        assert (
            await session.execute(
                select(FoodRecommendationRetry.dismissed_id, FoodRecommendationRetry.replacement_id)
            )
        ).all() == [(int(original_id), int(legacy_id))]

    await save(api_client, owner, {"id": home_id})
    deleted = await api_client.delete(f"/api/v1/meals/{meal['id']}", headers=owner)
    assert deleted.status_code == 204
    remaining = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    assert [card["id"] for card in remaining] == [home_id]


@pytest.mark.parametrize("tried", [False, True], ids=["저장된_추천", "시도한_추천"])
async def test_목록에서만_제거하고_추천과_시도_기록은_보존한다(
    api_client, monkeypatch, session_factory, tried
):
    owner, items = await prepare_suggestions(api_client, monkeypatch)
    selected, other = [await save(api_client, owner, item) for item in items]
    if tried:
        trial_meal = await record_try(api_client, owner, selected)
        async with session_factory() as session:
            attempt = await session.scalar(
                select(FoodRecommendationTry).where(
                    FoodRecommendationTry.food_recommendation_id == int(selected["id"])
                )
            )
            attempt.feedback = FoodRecommendationFeedback.HELPFUL
            await session.commit()
        # Remove must not weaken the original decision Undo protection.
        blocked = await api_client.delete(
            f"/api/v1/suggestions/{selected['id']}/decision", headers=owner
        )
        assert blocked.status_code == 409
        assert blocked.json()["error_code"] == "RECOMMENDATION_ALREADY_TRIED"
    meals_before = (await api_client.get("/api/v1/meals", headers=owner)).json()

    endpoint = f"/api/v1/suggestions/{selected['id']}/saved"
    removed = await api_client.delete(endpoint, headers=owner)
    assert removed.status_code == 204, removed.text
    assert removed.content == b""
    listed = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    assert [item["id"] for item in listed] == [other["id"]]
    assert (await api_client.get("/api/v1/meals", headers=owner)).json() == meals_before

    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
        assert item.status.value == ("TRIED" if tried else "SAVED")
        removed_at = item.removed_from_saved_at
        assert removed_at is not None
    assert (await api_client.delete(endpoint, headers=owner)).status_code == 204
    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
        assert item.removed_from_saved_at == removed_at

    if tried:
        # Editing the recorded food must retain its existing recommendation and feedback.
        recorded_food = trial_meal["foods"][0]
        updated = await api_client.put(
            f"/api/v1/meals/{trial_meal['id']}/foods",
            headers=owner,
            json={"foods": [{**food_payload("Edited serving"), "id": recorded_food["id"]}]},
        )
        assert updated.status_code == 200, updated.text
        attempt = updated.json()["foods"][0]["recommendation_tries"][0]
        assert attempt["food_recommendation_id"] == selected["id"]
        assert attempt["feedback"] == "HELPFUL"


async def test_마지막_시도_삭제로_상태가_바뀌어도_제거를_유지하고_다시_저장할_수_있다(
    api_client, monkeypatch, session_factory
):
    owner, items = await prepare_suggestions(api_client, monkeypatch)
    selected = await save(api_client, owner, items[0])
    tried = await record_try(api_client, owner, selected)
    removed = await api_client.delete(f"/api/v1/suggestions/{selected['id']}/saved", headers=owner)
    assert removed.status_code == 204, removed.text
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
    assert (
        await api_client.delete(f"/api/v1/meals/{tried['id']}", headers=owner)
    ).status_code == 204
    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
        assert item.status.value == "SAVED"
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
    await save(api_client, owner, selected)
    assert [
        item["id"] for item in (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    ] == [selected["id"]]


async def test_권한이_없거나_없는_추천은_거부하고_목록을_유지한다(api_client, monkeypatch):
    owner, items = await prepare_suggestions(api_client, monkeypatch)
    selected = await save(api_client, owner, items[0])
    stranger = await auth_headers(api_client, "saved-stranger@example.com")
    before = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    endpoint = f"/api/v1/suggestions/{selected['id']}/saved"
    assert (await api_client.delete(endpoint)).status_code == 401
    for request_path, headers in (
        (endpoint, stranger),
        ("/api/v1/suggestions/999999/saved", owner),
    ):
        response = await api_client.delete(request_path, headers=headers)
        assert response.status_code == 404
        assert response.json()["error_code"] == "SUGGESTION_NOT_FOUND"
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == before


@pytest.mark.parametrize("status", ["PENDING", "DISMISSED"], ids=["미처리", "제외"])
async def test_보관되지_않은_추천_제거는_기존_처리_상태를_유지한다(
    api_client, monkeypatch, session_factory, status
):
    owner, items = await prepare_suggestions(api_client, monkeypatch)
    selected = items[0]
    if status == "DISMISSED":
        response = await api_client.put(
            f"/api/v1/suggestions/{selected['id']}/decision",
            headers=owner,
            json={"status": "DISMISSED", "dismiss_reasons": ["DISLIKE"]},
        )
        assert response.status_code == 200, response.text
    removed = await api_client.delete(f"/api/v1/suggestions/{selected['id']}/saved", headers=owner)
    assert removed.status_code == 204, removed.text
    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
        assert item.status.value == status and item.removed_from_saved_at is None
        assert item.dismiss_reasons == (["DISLIKE"] if status == "DISMISSED" else [])
    await save(api_client, owner, selected)
    assert [
        item["id"] for item in (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    ] == [selected["id"]]


async def test_저장_실패는_보관_해제를_되돌리고_재시도로_제거할_수_있다(
    api_client, monkeypatch, session_factory
):
    owner, items = await prepare_suggestions(api_client, monkeypatch)
    selected = await save(api_client, owner, items[0])
    endpoint = f"/api/v1/suggestions/{selected['id']}/saved"
    before = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    original_flush = AsyncSession.flush

    async def fail_removal_flush(session, *args, **kwargs):
        removing = any(
            isinstance(item, FoodRecommendation) and item.removed_from_saved_at is not None
            for item in session.dirty
        )
        await original_flush(session, *args, **kwargs)
        if removing:
            raise RuntimeError("simulated removal write failure")

    with monkeypatch.context() as patch:
        patch.setattr(AsyncSession, "flush", fail_removal_flush)
        with pytest.raises(RuntimeError, match="simulated removal write failure"):
            await api_client.delete(endpoint, headers=owner)
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == before
    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
        assert item.removed_from_saved_at is None
    assert (await api_client.delete(endpoint, headers=owner)).status_code == 204
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
