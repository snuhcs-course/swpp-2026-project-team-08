# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
"""Exercise the real router/service/database, replacing only the slow generator."""

from unittest.mock import AsyncMock

import pytest

from app.features.suggestions import mock
from tests.test_meal_logs import CHILD, FOOD_ID, MEAL_ID, meal_payload, put_meal, review_payload

ROOT = f"/api/v1/children/{CHILD}/suggestions"


@pytest.fixture(autouse=True)
def generator(monkeypatch):
    async def generate(foods):
        return [
            {
                "food_id": f["id"],
                "what_to_try": f["name"],
                "why_this_may_help": "A familiar portion",
                "serving_tip": "No pressure",
            }
            for f in foods
        ]

    mocked = AsyncMock(side_effect=generate)
    monkeypatch.setattr(mock, "generate_suggestions", mocked)
    return mocked


async def setup(client):
    await put_meal(client)
    await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review", json=review_payload())
    res = await client.post(f"{ROOT}/meals/{MEAL_ID}/generate", json={})
    assert res.status_code == 200, res.text
    return res.json()["items"][0]


async def decision(client, item, action="action-1", status="saved"):
    return await client.put(
        f"{ROOT}/{item['id']}/decision",
        json={
            "action_id": action,
            "version": item["version"],
            "status": status,
            "reasons": ["not_suitable"] if status == "dismissed" else [],
        },
    )


async def test_generation_resumes_and_only_generates_added_foods(client, generator):
    item = await setup(client)
    saved = await decision(client, item)
    assert saved.status_code == 200
    resumed = await client.post(f"{ROOT}/meals/{MEAL_ID}/generate", json={})
    assert resumed.json()["items"][0]["status"] == "saved"
    assert generator.await_count == 1
    wrong = await client.post(
        f"{ROOT}/meals/{MEAL_ID}/generate", json={"selected_food_ids": ["wrong"]}
    )
    assert wrong.status_code == 409
    assert (await client.get(f"/api/v1/children/other/suggestions/{item['id']}")).status_code == 404


async def test_decision_replay_undo_and_failure_preserve_state(client):
    item = await setup(client)
    first = await decision(client, item)
    replay = await decision(client, item)
    assert first.json() == replay.json()
    stale = await decision(client, item, "action-2", "dismissed")
    assert stale.status_code == 409
    undo = await client.post(f"{ROOT}/{item['id']}/undo", json={"action_id": "action-1"})
    assert undo.json()["status"] == "pending"
    assert undo.json()["saved_at"] is None
    assert (await client.get(ROOT)).json() == []


async def test_try_idempotency_feedback_and_source_deletion(client):
    item = await setup(client)
    await decision(client, item)
    await put_meal(
        client,
        meal_id="new-meal",
        foods=[
            {
                **meal_payload()["foods"][0],
                "id": "new-food",
            }
        ],
    )
    url = f"{ROOT}/{item['id']}"
    eligible = await client.get(f"{url}/eligible-meals")
    assert [m["id"] for m in eligible.json()] == ["new-meal"]
    body = {"meal_id": "new-meal", "target_id": "food:new-food"}
    tried = await client.post(f"{url}/tries", json=body)
    repeat = await client.post(f"{url}/tries", json=body)
    assert tried.status_code == 200, tried.text
    assert tried.json()["id"] == repeat.json()["id"]
    bad = await client.post(f"{url}/tries", json={**body, "target_id": "food:missing"})
    assert bad.status_code == 409
    feedback = await client.put(
        f"{url}/tries/{tried.json()['id']}/feedback", json={"feedback": "helpful"}
    )
    assert feedback.json()["feedback"] == "helpful"
    await client.delete(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    snapshot = (await client.get(ROOT)).json()[0]
    assert snapshot["content"]["food_name"] == "Rolled Omelet"
    assert len(snapshot["tries"]) == 1
    await client.put(f"{url}/saved", json={"saved": False})
    assert (await client.get(ROOT)).json() == []
    assert (await client.get(url)).json()["tries"][0]["feedback"] == "helpful"


async def test_bad_generation_is_atomic_and_review_edits_regenerate(client, generator):
    item = await setup(client)
    await decision(client, item)
    changed = review_payload()
    changed["saved_at"] = "2026-10-10T13:00:00Z"
    await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review", json=changed)
    generator.side_effect = None
    generator.return_value = []
    bad = await client.post(f"{ROOT}/meals/{MEAL_ID}/generate", json={})
    assert bad.status_code == 502
    assert (await client.get(ROOT)).json()[0]["id"] == item["id"]


async def test_missing_review_and_old_try_are_rejected(client):
    await put_meal(client)
    res = await client.post(f"{ROOT}/meals/{MEAL_ID}/generate", json={})
    assert res.status_code == 404
    item = await setup(client)
    await decision(client, item)
    res = await client.post(
        f"{ROOT}/{item['id']}/tries", json={"meal_id": MEAL_ID, "target_id": f"food:{FOOD_ID}"}
    )
    assert res.status_code == 409


async def test_added_selection_only_generates_missing_food_and_preserves_saved(client, generator):
    foods = [{**meal_payload()["foods"][0], "id": f"f{i}", "name": f"Food {i}"} for i in range(4)]
    await put_meal(client, foods=foods, exposure_food_id="f0")
    await client.put(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}/review", json=review_payload())
    url = f"{ROOT}/meals/{MEAL_ID}/generate"
    first = (await client.post(url, json={})).json()
    assert first["selected_food_ids"] == ["f0", "f1", "f2"]
    saved = await decision(client, first["items"][0])
    changed = await client.post(url, json={"selected_food_ids": ["f1", "f3"]})
    assert changed.status_code == 200, changed.text
    assert generator.await_args.args[0] == [{"id": "f3", "name": "Food 3"}]
    assert (await client.get(ROOT)).json()[0]["id"] == saved.json()["id"]
    restored = (await client.post(url, json={"selected_food_ids": ["f0", "f3"]})).json()
    assert restored["items"][0]["status"] == "saved"
    assert generator.await_count == 2


async def test_sequential_undo_preserves_existing_save_and_try(client):
    item = await setup(client)
    await client.put(f"{ROOT}/{item['id']}/saved", json={"saved": True})
    fresh = (await client.get(f"{ROOT}/{item['id']}")).json()
    await decision(client, fresh)
    undo = await client.post(f"{ROOT}/{item['id']}/undo", json={"action_id": "action-1"})
    assert undo.json()["saved_at"] is not None
    assert undo.json()["status"] == "pending"
    dismissed = await decision(client, undo.json(), action="action-2", status="dismissed")
    assert dismissed.json()["dismiss_reasons"] == ["not_suitable"]
    undo = await client.post(f"{ROOT}/{item['id']}/undo", json={"action_id": "action-2"})
    assert undo.json()["dismiss_reasons"] == []


async def test_meal_details_include_server_suggestion_and_linked_missing_flag(client):
    item = await setup(client)
    await decision(client, item)
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/{MEAL_ID}")
    assert detail.json()["suggestions"][0]["managed"] is True
    await put_meal(
        client, meal_id="try-meal", foods=[{**meal_payload()["foods"][0], "id": "try-food"}]
    )
    url = f"{ROOT}/{item['id']}"
    await client.post(f"{url}/tries", json={"meal_id": "try-meal", "target_id": "food:try-food"})
    detail = await client.get(f"/api/v1/children/{CHILD}/meals/try-meal")
    assert detail.json()["suggestions"][0]["food_id"] == "try-food"
    assert detail.json()["review"] is None
    await client.delete(f"/api/v1/children/{CHILD}/meals/try-meal")
    assert (await client.get(url)).json()["tries"][0]["linked_available"] is False
    assert (await client.get(url)).json()["tries"][0]["meal_type"] is None


async def test_multiple_trials_return_each_meal_type_and_open_existing_meal_details(client):
    item = await setup(client)
    await decision(client, item)
    url = f"{ROOT}/{item['id']}"
    trial_ids = []
    for meal_type in ("lunch", "dinner"):
        meal_id = f"trial-{meal_type}"
        food_id = f"food-{meal_type}"
        await put_meal(
            client,
            meal_id=meal_id,
            meal_type=meal_type,
            foods=[{**meal_payload()["foods"][0], "id": food_id}],
        )
        response = await client.post(
            f"{url}/tries", json={"meal_id": meal_id, "target_id": f"food:{food_id}"}
        )
        assert response.status_code == 200, response.text
        trial = response.json()
        trial_ids.append(trial["id"])
        assert trial["meal_type"] == meal_type
        assert trial["linked_available"] is True
        detail = (await client.get(f"/api/v1/children/{CHILD}/meals/{trial['meal_id']}")).json()
        assert detail["meal_type"] == meal_type
        assert detail["review"] is None
        assert detail["suggestions"][0]["id"] == item["id"]

    trials = (await client.get(url)).json()["tries"]
    assert {trial["id"] for trial in trials} == set(trial_ids)
    assert {trial["meal_type"] for trial in trials} == {"lunch", "dinner"}
    assert len({trial["tried_on"] for trial in trials}) == 1
    saved_trials = (await client.get(ROOT)).json()[0]["tries"]
    assert saved_trials == trials
    feedback = await client.put(
        f"{url}/tries/{trial_ids[0]}/feedback", json={"feedback": "helpful"}
    )
    assert feedback.json()["meal_type"] == "lunch"
    assert feedback.json()["linked_available"] is True


async def test_all_six_design_dismissal_reasons_round_trip_and_undo(client):
    item = await setup(client)
    reasons = [
        "restriction_conflict",
        "disliked_food_or_form",
        "food_preferences",
        "too_much_preparation",
        "ingredient_unavailable",
        "already_tried",
    ]
    url = f"{ROOT}/{item['id']}"
    result = await client.put(
        f"{url}/decision",
        json={
            "action_id": "all-design-reasons",
            "version": item["version"],
            "status": "dismissed",
            "reasons": reasons,
        },
    )
    assert result.status_code == 200, result.text
    assert result.json()["dismiss_reasons"] == reasons
    restored = await client.post(f"{url}/undo", json={"action_id": "all-design-reasons"})
    assert restored.json()["dismiss_reasons"] == []


async def test_eligible_meals_document_nested_response_and_only_lookup_errors(client):
    schema = (await client.get("/openapi.json")).json()
    responses = schema["paths"][
        "/api/v1/children/{child_id}/suggestions/{suggestion_id}/eligible-meals"
    ]["get"]["responses"]
    assert responses["200"]["content"]["application/json"]["schema"]["items"] == {
        "$ref": "#/components/schemas/EligibleMealResponse"
    }
    meal_schema = schema["components"]["schemas"]["EligibleMealResponse"]
    assert meal_schema["properties"]["targets"]["items"] == {
        "$ref": "#/components/schemas/EligibleTargetResponse"
    }
    assert set(responses) == {"200", "404", "422"}
    assert responses["404"]["description"] == "SUGGESTION_NOT_FOUND"

    item = await setup(client)
    url = f"{ROOT}/{item['id']}/eligible-meals"
    # An existing but unsaved suggestion cannot accept a linked meal.
    unsaved = await client.get(url)
    assert unsaved.status_code == 404
    assert unsaved.json() == {"error_code": "SUGGESTION_NOT_FOUND", "details": {}}
    await decision(client, item)
    await put_meal(client, meal_id="eligible-reviewed")
    await client.put(
        f"/api/v1/children/{CHILD}/meals/eligible-reviewed/review", json=review_payload()
    )
    await put_meal(client, meal_id="eligible-unreviewed")
    result = await client.get(url)
    assert result.status_code == 200, result.text
    by_id = {meal["id"]: meal for meal in result.json()}
    assert set(by_id) == {"eligible-reviewed", "eligible-unreviewed"}
    assert by_id["eligible-unreviewed"] == {
        "id": "eligible-unreviewed",
        "meal_date": "2026-10-09",
        "meal_type": "dinner",
        "reviewed": False,
        "foods": ["Rolled Omelet"],
        "targets": [{"id": f"food:{FOOD_ID}", "name": "Rolled Omelet", "food_id": FOOD_ID}],
    }
    assert by_id["eligible-reviewed"]["reviewed"] is True
    assert by_id["eligible-reviewed"]["targets"][1] == {
        "id": f"ingredient:{FOOD_ID}:ing-egg",
        "name": "Egg",
        "food_id": FOOD_ID,
    }
    for invalid_url in (
        f"{ROOT}/missing/eligible-meals",
        f"/api/v1/children/other/suggestions/{item['id']}/eligible-meals",
    ):
        missing = await client.get(invalid_url)
        assert missing.status_code == 404
        assert missing.json() == {"error_code": "SUGGESTION_NOT_FOUND", "details": {}}


async def test_linked_snapshot_maps_source_and_ingredient_trial_without_changing_response(client):
    item = await setup(client)
    await decision(client, item)
    meals = f"/api/v1/children/{CHILD}/meals"
    expected = {
        "id": item["id"],
        "food_id": FOOD_ID,
        "title": "Rolled Omelet",
        "description": "A familiar portion",
        "serving_tip": "No pressure",
        "ingredients": ["Egg", "Carrot"],
        "managed": True,
    }
    assert (await client.get(f"{meals}/{MEAL_ID}")).json()["suggestions"] == [expected]
    trial_food = "ingredient-trial-food"
    await put_meal(
        client,
        meal_id="ingredient-trial",
        foods=[{**meal_payload()["foods"][0], "id": trial_food}],
        exposure_food_id=trial_food,
    )
    review = review_payload()
    review["outcomes"][0]["food_id"] = trial_food
    review["difficulties"] = {trial_food: []}
    await client.put(f"{meals}/ingredient-trial/review", json=review)
    tried = await client.post(
        f"{ROOT}/{item['id']}/tries",
        json={"meal_id": "ingredient-trial", "target_id": f"ingredient:{trial_food}:ing-egg"},
    )
    assert tried.status_code == 200, tried.text
    assert (await client.get(f"{meals}/ingredient-trial")).json()["suggestions"] == [
        {**expected, "food_id": trial_food}
    ]
    # Unsave hides the source bookmark but preserves the trial's historical snapshot.
    await client.put(f"{ROOT}/{item['id']}/saved", json={"saved": False})
    assert (await client.get(f"{meals}/{MEAL_ID}")).json()["suggestions"] == []
    assert (await client.get(f"{meals}/ingredient-trial")).json()["suggestions"] == [
        {**expected, "food_id": trial_food}
    ]


# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
async def test_pending_link_records_try_only_after_confirmed_review_and_once(client):
    item = await setup(client)
    await decision(client, item)
    link = {
        "suggestion_id": item["id"],
        "food_id": FOOD_ID,
        "title": item["content"]["food_name"],
        "description": item["content"]["what_to_try"],
    }
    trial = await put_meal(client, meal_id="abc-trial", suggestion_links=[link])
    assert trial.status_code == 200, trial.text
    assert (await client.get(f"{ROOT}/{item['id']}")).json()["tries"] == []
    review = {
        **review_payload(),
        "after_photo_uri": "",
        "suggestion_feedback": {item["id"]: "notTried"},
    }
    path = f"/api/v1/children/{CHILD}/meals/abc-trial/review"
    assert (await client.put(path, json=review)).status_code == 200
    assert (await client.get(f"{ROOT}/{item['id']}")).json()["tries"] == []
    review["suggestion_feedback"] = {item["id"]: "tried"}
    assert (await client.put(path, json=review)).status_code == 200
    assert (await client.put(path, json=review)).status_code == 200
    tries = (await client.get(f"{ROOT}/{item['id']}")).json()["tries"]
    assert len(tries) == 1
    assert tries[0]["meal_id"] == "abc-trial"
    assert tries[0]["target_id"] == f"food:{FOOD_ID}"
