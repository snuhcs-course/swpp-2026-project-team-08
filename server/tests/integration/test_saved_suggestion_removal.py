# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 저장 목록 제거와 시도 기록 보존 검증

"""실제 API·SQLite로 보관 해제, 재저장, 권한과 시도 이력을 검증한다."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FoodRecommendation, FoodRecommendationTry
from app.models.food_recommendation_enums import FoodRecommendationFeedback
from tests.fixtures.meals import food_payload, meal_payload
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model, save_profile, seed_ingredient


async def prepare_suggestions(client, monkeypatch):
    owner = await auth_headers(client, "saved-removal@example.com")
    await save_profile(client, owner)
    await seed_ingredient("쌀")
    install_model(monkeypatch, [batch("0", "1")])
    created = await client.put(
        "/api/v1/meals",
        headers=owner,
        json=meal_payload(food_payload("Potato"), food_payload("Rice", "쌀")),
    )
    assert created.status_code == 200, created.text
    meal = created.json()
    reviewed = await client.put(
        f"/api/v1/meals/{meal['id']}/review",
        headers=owner,
        json={
            "food_results": [
                {"food_id": item["id"], "outcome": "TASTED", "difficulty_reasons": []}
                for item in meal["foods"]
            ]
        },
    )
    assert reviewed.status_code == 200, reviewed.text
    path = f"/api/v1/meals/{meal['id']}/suggestions"
    generated = await client.post(
        path,
        headers=owner,
        json={"targets": [{"food_id": item["id"]} for item in meal["foods"]]},
    )
    assert generated.status_code == 201, generated.text
    return owner, path, generated.json()


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


@pytest.mark.parametrize("tried", [False, True], ids=["저장된_추천", "시도한_추천"])
async def test_목록에서만_제거하고_추천과_시도_기록은_보존한다(
    api_client, monkeypatch, session_factory, tried
):
    owner, path, items = await prepare_suggestions(api_client, monkeypatch)
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
    before = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    meals_before = (await api_client.get("/api/v1/meals", headers=owner)).json()

    endpoint = f"/api/v1/suggestions/{selected['id']}/saved"
    removed = await api_client.delete(endpoint, headers=owner)
    assert removed.status_code == 204, removed.text
    assert removed.content == b""
    for listed_path in ("/api/v1/suggestions", path, path + "?status=SAVED"):
        listed = (await api_client.get(listed_path, headers=owner)).json()
        assert [item["id"] for item in listed] == [other["id"]]
    assert (await api_client.get(path + "?status=ALL", headers=owner)).json() == before
    assert (await api_client.get("/api/v1/meals", headers=owner)).json() == meals_before

    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(selected["id"]))
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
    api_client, monkeypatch
):
    owner, path, items = await prepare_suggestions(api_client, monkeypatch)
    selected = await save(api_client, owner, items[0])
    tried = await record_try(api_client, owner, selected)
    removed = await api_client.delete(f"/api/v1/suggestions/{selected['id']}/saved", headers=owner)
    assert removed.status_code == 204, removed.text
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
    assert (
        await api_client.delete(f"/api/v1/meals/{tried['id']}", headers=owner)
    ).status_code == 204
    history = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    assert next(item for item in history if item["id"] == selected["id"])["status"] == "SAVED"
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
    await save(api_client, owner, selected)
    assert [
        item["id"] for item in (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    ] == [selected["id"]]


async def test_권한이_없거나_없는_추천은_거부하고_목록을_유지한다(api_client, monkeypatch):
    owner, _, items = await prepare_suggestions(api_client, monkeypatch)
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
async def test_보관되지_않은_추천_제거는_기존_처리_상태를_유지한다(api_client, monkeypatch, status):
    owner, path, items = await prepare_suggestions(api_client, monkeypatch)
    selected = items[0]
    if status == "DISMISSED":
        response = await api_client.put(
            f"/api/v1/suggestions/{selected['id']}/decision",
            headers=owner,
            json={"status": "DISMISSED", "dismiss_reasons": ["DISLIKE"]},
        )
        assert response.status_code == 200, response.text
    before = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    removed = await api_client.delete(f"/api/v1/suggestions/{selected['id']}/saved", headers=owner)
    assert removed.status_code == 204, removed.text
    assert (await api_client.get(path + "?status=ALL", headers=owner)).json() == before
    await save(api_client, owner, selected)
    assert [
        item["id"] for item in (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    ] == [selected["id"]]


async def test_저장_실패는_보관_해제를_되돌리고_재시도로_제거할_수_있다(
    api_client, monkeypatch, session_factory
):
    owner, _, items = await prepare_suggestions(api_client, monkeypatch)
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
