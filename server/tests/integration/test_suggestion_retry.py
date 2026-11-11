# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 통합 생성 API의 추가 추천·재시도·횟수·권한 검증

"""실제 API·DB·그래프로 추가 추천 한도와 재요청을 검증한다."""

from langchain_core.messages import HumanMessage
from sqlalchemy import select

from app.models import FoodRecommendation, FoodRecommendationRetry
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model, save_profile, seed_ingredient
from tests.integration.test_contract_api import food


async def setup_meal(client, monkeypatch, *, extra_food=False):
    owner = await auth_headers(client, "retry@example.com")
    await save_profile(client, owner)
    await seed_ingredient("쌀")
    meal = (
        await client.put(
            "/api/v1/meals",
            headers=owner,
            json={
                "meal_date": "2026-11-09",
                "meal_type": "LUNCH",
                "setting": "HOME",
                "foods": [food("Potato", "감자"), food("Rice", "쌀")]
                + ([food("Carrot", "당근")] if extra_food else []),
            },
        )
    ).json()
    review = {
        "food_results": [
            {"food_id": item["id"], "outcome": "TASTED", "difficulty_reasons": []}
            for item in meal["foods"]
        ]
    }
    assert (
        await client.put(f"/api/v1/meals/{meal['id']}/review", headers=owner, json=review)
    ).status_code == 200
    model = install_model(monkeypatch, [batch("0", "1"), batch("0")])
    path = f"/api/v1/meals/{meal['id']}/suggestions"
    targets = {"targets": [{"food_id": item["id"]} for item in meal["foods"][:2]]}
    response = await client.post(path, headers=owner, json=targets)
    assert response.status_code == 201, response.text
    return owner, meal, review, model, path, targets, response.json()


def retry_target(item):
    return {"food_id": item["origin_food_id"], "rejected_suggestion_id": item["id"]}


async def request_retry(client, owner, item):
    return await client.post(
        f"/api/v1/meals/{item['meal_id']}/suggestions",
        headers=owner,
        json={"targets": [retry_target(item)]},
    )


async def dismiss(client, owner, item):
    response = await client.put(
        f"/api/v1/suggestions/{item['id']}/decision",
        headers=owner,
        json={"status": "DISMISSED", "dismiss_reasons": ["TOO_MUCH_PREPARATION"]},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_optional_generation_replays_result_and_undo_never_resets_limit(
    api_client, monkeypatch
):
    owner, meal, _, model, path, targets, items = await setup_meal(api_client, monkeypatch)
    original, other = items
    baseline = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    other_before = next(row for row in baseline if row["id"] == other["id"])
    dismissed = await dismiss(api_client, owner, original)
    assert dismissed["can_regenerate"] is True
    assert len(model.compose_inputs) == 1  # Dismissal alone does not generate.
    replay = await api_client.post(path, headers=owner, json=targets)
    assert [item["id"] for item in replay.json()] == [original["id"], other["id"]]
    assert len(model.compose_inputs) == 1
    created = await request_retry(api_client, owner, original)
    assert created.status_code == 201, created.text
    extra = created.json()[0]
    assert extra["id"] not in [item["id"] for item in items]
    assert extra["replacement_for_id"] == original["id"]
    assert extra["origin_food_id"] == original["origin_food_id"]
    prompt = next(m.content for m in model.compose_inputs[-1] if isinstance(m, HumanMessage))
    assert original["what_to_try"] in prompt and "TOO_MUCH_PREPARATION" in prompt
    assert "rejected_suggestion" in prompt
    rows = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    assert len(rows) == 3
    assert next(row for row in rows if row["id"] == other["id"]) == other_before
    assert next(row for row in rows if row["id"] == original["id"])["can_regenerate"] is False
    for _ in range(2):
        assert (await request_retry(api_client, owner, original)).json()[0]["id"] == extra["id"]
    assert len(model.compose_inputs) == 2
    assert (await dismiss(api_client, owner, extra))["can_regenerate"] is False
    assert (await request_retry(api_client, owner, extra)).status_code == 409
    await api_client.delete(f"/api/v1/suggestions/{original['id']}/decision", headers=owner)
    assert (await dismiss(api_client, owner, original))["can_regenerate"] is False
    assert (await request_retry(api_client, owner, original)).json()[0]["id"] == extra["id"]
    ordinary = (await api_client.post(path, headers=owner, json=targets)).json()
    assert ordinary[0]["id"] == extra["id"]
    assert len(model.compose_inputs) == 2


async def test_each_food_has_its_own_optional_generation(api_client, monkeypatch):
    owner, _, _, model, path, _, items = await setup_meal(api_client, monkeypatch)
    model.drafts.append(batch("0"))
    for item in items:
        assert (await dismiss(api_client, owner, item))["can_regenerate"] is True
    assert len(model.compose_inputs) == 1
    extras = []
    for item in items:
        response = await request_retry(api_client, owner, item)
        assert response.status_code == 201, response.text
        extras.append(response.json()[0])
    assert [item["origin_food_id"] for item in extras] == [item["origin_food_id"] for item in items]
    rows = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    assert len(rows) == 4
    assert not any(item["can_regenerate"] for item in rows)
    assert len(model.compose_inputs) == 3


async def test_failure_preserves_opportunity_and_undo_hides_it(
    api_client, monkeypatch, session_factory
):
    owner, _, _, _, path, _, items = await setup_meal(api_client, monkeypatch)
    original = items[0]
    await dismiss(api_client, owner, original)
    decision = f"/api/v1/suggestions/{original['id']}/decision"
    undone = await api_client.delete(decision, headers=owner)
    assert undone.json()["can_regenerate"] is False
    assert (await request_retry(api_client, owner, original)).status_code == 409
    assert (await dismiss(api_client, owner, original))["can_regenerate"] is True
    # Invalid ingredients fail the real validation graph, not just the transport.
    from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
    from app.features.suggestions.workflow.schemas import SuggestionsDraft
    from tests.helpers.suggestions import suggestion_draft

    invalid = SuggestionsDraft(suggestions=[suggestion_draft(ingredients=["없는재료"])])
    failed_model = install_model(monkeypatch, [invalid] * MAX_ATTEMPTS)
    failed = await request_retry(api_client, owner, original)
    assert failed.status_code == 502
    assert len(failed_model.compose_inputs) == MAX_ATTEMPTS
    async with session_factory() as session:
        history = await session.get(FoodRecommendationRetry, int(original["origin_food_id"]))
        assert history.replacement_id is None
    listed = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    assert len(listed) == 2
    assert next(item for item in listed if item["id"] == original["id"])["can_regenerate"] is True
    install_model(monkeypatch, [batch("0")])
    assert (await request_retry(api_client, owner, original)).status_code == 201


async def test_ownership_eaten_and_non_dismissed_targets_are_rejected(api_client, monkeypatch):
    owner, meal, review, model, path, targets, items = await setup_meal(api_client, monkeypatch)
    original = items[0]
    stranger = await auth_headers(api_client, "stranger@example.com")
    assert (await request_retry(api_client, stranger, original)).status_code == 404
    assert (await request_retry(api_client, owner, original)).status_code == 409
    await dismiss(api_client, owner, items[0])
    review["food_results"][0]["outcome"] = "EATEN"
    await api_client.put(f"/api/v1/meals/{meal['id']}/review", headers=owner, json=review)
    assert (await request_retry(api_client, owner, original)).status_code == 422
    assert (await api_client.post(path, headers=owner, json=targets)).status_code == 422
    assert len(model.compose_inputs) == 1


async def test_legacy_dismissal_is_not_backfilled_from_current_status(
    api_client, monkeypatch, session_factory
):
    owner, _, _, _, path, _, items = await setup_meal(api_client, monkeypatch)
    original = items[0]
    async with session_factory() as session:
        item = await session.get(FoodRecommendation, int(original["id"]))
        item.status = "DISMISSED"
        item.dismiss_reasons = ["DISLIKE"]
        await session.commit()
    listed = (await api_client.get(path + "?status=ALL", headers=owner)).json()
    assert not any(item["can_regenerate"] for item in listed)
    assert (await dismiss(api_client, owner, original))["can_regenerate"] is False
    assert (await request_retry(api_client, owner, original)).status_code == 409
    async with session_factory() as session:
        assert list((await session.scalars(select(FoodRecommendationRetry))).all()) == []


async def test_unified_generation_validates_the_whole_batch_and_preserves_target_order(
    api_client,
    monkeypatch,
):
    owner, meal, _, model, path, _, items = await setup_meal(
        api_client,
        monkeypatch,
        extra_food=True,
    )
    original, other = items
    await dismiss(api_client, owner, original)
    new_target = {"food_id": meal["foods"][2]["id"]}
    invalid = await api_client.post(
        path,
        headers=owner,
        json={
            "targets": [
                new_target,
                {"food_id": other["origin_food_id"], "rejected_suggestion_id": original["id"]},
            ]
        },
    )
    assert invalid.status_code == 422
    assert invalid.json()["error_code"] == "INVALID_SUGGESTION_TARGET"
    assert len(model.compose_inputs) == 1
    assert len((await api_client.get(path + "?status=ALL", headers=owner)).json()) == 2

    model.drafts[:] = [batch("0", "1")]
    payload = {"targets": [new_target, retry_target(original)]}
    response = await api_client.post(path, headers=owner, json=payload)
    assert response.status_code == 201, response.text
    fresh, extra = response.json()
    assert fresh["origin_food_id"] == new_target["food_id"]
    assert fresh["replacement_for_id"] is None
    assert extra["origin_food_id"] == original["origin_food_id"]
    assert extra["replacement_for_id"] == original["id"]
    assert len(model.compose_inputs) == 2
    prompt = next(m.content for m in model.compose_inputs[-1] if isinstance(m, HumanMessage))
    assert prompt.count("rejected_suggestion:") == 1
    assert "id: 1, name: Potato" in prompt
    replay = await api_client.post(path, headers=owner, json=payload)
    assert [item["id"] for item in replay.json()] == [fresh["id"], extra["id"]]
    assert len(model.compose_inputs) == 2


async def test_rejected_suggestion_id_uses_the_existing_id_contract(api_client, monkeypatch):
    owner, _, _, model, path, _, items = await setup_meal(api_client, monkeypatch)
    for invalid_id in ("0", "-1", "9223372036854775808", "not-an-id", 1):
        response = await api_client.post(
            path,
            headers=owner,
            json={
                "targets": [
                    {
                        "food_id": items[0]["origin_food_id"],
                        "rejected_suggestion_id": invalid_id,
                    }
                ]
            },
        )
        assert response.status_code == 422
    from app.main import app

    assert "/api/v1/suggestions/{suggestion_id}/regenerate" not in app.openapi()["paths"]
    assert len(model.compose_inputs) == 1
