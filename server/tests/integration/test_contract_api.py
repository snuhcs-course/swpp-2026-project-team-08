# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 단위 추천, 대문자 enum, 시도(TRIED) 상태와 삭제 연쇄를 따르는 흐름으로 재작성
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

"""Integration: 실제 API·서비스·SQLite 연결. LLM만 가짜 모델로 대체한다."""

import pytest
from httpx import AsyncClient

from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model, save_profile, seed_ingredient


def food(name: str, *ingredients: str) -> dict:
    return {
        "name": name,
        "ingredients": [{"name": item} for item in ingredients],
        "cooking_method": "STIR_FRIED",
        "serving_note": None,
        "acceptance": 1,
    }


def tries(meal: dict) -> list[dict]:
    return [attempt for item in meal["foods"] for attempt in item["recommendation_tries"]]


@pytest.mark.asyncio
async def test_meal_review_suggestion_and_history_flow(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    install_model(monkeypatch, [batch("0", "1")])
    owner = await auth_headers(api_client, "owner@example.com")
    stranger = await auth_headers(api_client, "stranger@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("쌀")

    saved = await api_client.put(
        "/api/v1/meals",
        headers=owner,
        json={
            "meal_date": "2026-10-20",
            "meal_type": "LUNCH",
            "setting": "HOME",
            "foods": [food("당근 감자볶음", "당근", "감자"), food("밥", "쌀")],
        },
    )
    assert saved.status_code == 200, saved.text
    meal = saved.json()
    meal_id = meal["id"]
    stir_fry, rice = meal["foods"]
    assert all(item["outcome"] is None for item in meal["foods"])
    detail = await api_client.get(f"/api/v1/meals/{meal_id}", headers=owner)
    assert [item["name"] for item in detail.json()["foods"][0]["ingredients"]] == ["당근", "감자"]
    assert (await api_client.get(f"/api/v1/meals/{meal_id}", headers=stranger)).status_code == 404
    assert (await api_client.get("/api/v1/meals", headers=stranger)).json() == []

    generate_path = f"/api/v1/meals/{meal_id}/suggestions"
    both = {"targets": [{"food_id": stir_fry["id"]}, {"food_id": rice["id"]}]}
    unreviewed = await api_client.post(generate_path, headers=owner, json=both)
    assert unreviewed.status_code == 409
    invalid_review = await api_client.put(
        f"/api/v1/meals/{meal_id}/review",
        headers=owner,
        json={"food_results": [{"food_id": stir_fry["id"], "outcome": "EATEN"}]},
    )
    assert invalid_review.status_code == 422  # 모든 음식을 한 번씩 포함해야 한다

    def review_body(carrot_outcome: str | None) -> dict:
        carrot = stir_fry["ingredients"][0]
        return {
            "after_photo_uri": "after.jpg",
            "food_results": [
                {
                    "food_id": stir_fry["id"],
                    "outcome": "UNTOUCHED",
                    "difficulty_reasons": ["TEXTURE.HARDNESS.HARD", "COLOR.BROWN"],
                    "ingredient_outcomes": [
                        {
                            "ingredient_id": carrot["id"],
                            "outcome": carrot_outcome,
                            "difficulty_reasons": ["SMELL.SULFUR"] if carrot_outcome else [],
                        }
                    ],
                },
                {"food_id": rice["id"], "outcome": "EATEN", "difficulty_reasons": []},
            ],
        }

    review = await api_client.put(
        f"/api/v1/meals/{meal_id}/review", headers=owner, json=review_body("UNTOUCHED")
    )
    assert review.status_code == 200, review.text
    reviewed = review.json()
    assert reviewed["after_photo_uri"] == "after.jpg"
    assert reviewed["foods"][0]["outcome"] == "UNTOUCHED"
    assert reviewed["foods"][0]["ingredients"][0]["outcome"] == "UNTOUCHED"
    assert reviewed["foods"][0]["ingredients"][1]["outcome"] is None
    replaced = await api_client.put(
        f"/api/v1/meals/{meal_id}/review", headers=owner, json=review_body(None)
    )
    assert replaced.status_code == 200, replaced.text
    assert replaced.json()["foods"][0]["ingredients"][0]["outcome"] is None

    invalid = await api_client.post(
        generate_path, headers=owner, json={"targets": [{"food_id": "9999"}]}
    )
    assert invalid.status_code == 422
    generated = await api_client.post(generate_path, headers=owner, json=both)
    assert generated.status_code == 201, generated.text
    assert [item["status"] for item in generated.json()] == ["PENDING", "PENDING"]
    first_id, second_id = [item["id"] for item in generated.json()]
    assert (await api_client.get(generate_path, headers=owner)).json() == []
    all_items = await api_client.get(f"{generate_path}?status=ALL", headers=owner)
    assert len(all_items.json()) == 2

    saved_suggestion = await api_client.put(
        f"/api/v1/suggestions/{first_id}/decision",
        headers=owner,
        json={"status": "SAVED", "dismiss_reasons": []},
    )
    assert saved_suggestion.status_code == 200, saved_suggestion.text
    assert saved_suggestion.json()["saved_at"] is not None
    dismissed = await api_client.put(
        f"/api/v1/suggestions/{second_id}/decision",
        headers=owner,
        json={"status": "DISMISSED", "dismiss_reasons": ["TOO_MUCH_PREPARATION"]},
    )
    assert dismissed.status_code == 200
    assert dismissed.json()["saved_at"] is None
    assert [
        item["id"] for item in (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    ] == [first_id]
    assert (
        await api_client.put(
            f"/api/v1/suggestions/{first_id}/decision",
            headers=stranger,
            json={"status": "DISMISSED", "dismiss_reasons": ["ALREADY_TRIED"]},
        )
    ).status_code == 404

    # 저장한 추천을 다음 식사에서 시도하면 추천은 TRIED 가 되고 목록에도 남는다.
    next_food = food("당근", "당근")
    next_food["food_recommendation_ids"] = [first_id]
    applied = await api_client.put(
        "/api/v1/meals",
        headers=owner,
        json={
            "meal_date": "2026-10-21",
            "meal_type": "DINNER",
            "setting": "HOME",
            "foods": [next_food],
        },
    )
    assert applied.status_code == 200, applied.text
    applied_id = applied.json()["id"]
    history = await api_client.get("/api/v1/meals", headers=owner)
    assert [item["id"] for item in history.json()] == [applied_id, meal_id]
    attempt = tries(history.json()[0])[0]
    assert attempt["food_recommendation_id"] == first_id
    assert attempt["recommendation"]["what_to_try"]
    listed = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    assert [(item["id"], item["status"]) for item in listed] == [(first_id, "TRIED")]
    for call in (
        api_client.put(
            f"/api/v1/suggestions/{first_id}/decision",
            headers=owner,
            json={"status": "DISMISSED", "dismiss_reasons": ["DISLIKE"]},
        ),
        api_client.delete(f"/api/v1/suggestions/{first_id}/decision", headers=owner),
    ):
        conflict = await call
        assert conflict.status_code == 409
        assert conflict.json()["error_code"] == "RECOMMENDATION_ALREADY_TRIED"

    # 시도한 식사를 지우면 추천은 시도 기록 없이 다시 SAVED 가 된다.
    assert (
        await api_client.delete(f"/api/v1/meals/{applied_id}", headers=stranger)
    ).status_code == 404
    assert (
        await api_client.delete(f"/api/v1/meals/{applied_id}", headers=owner)
    ).status_code == 204
    listed = (await api_client.get("/api/v1/suggestions", headers=owner)).json()
    assert [(item["id"], item["status"]) for item in listed] == [(first_id, "SAVED")]

    # 추천의 근거가 된 식사를 지우면 그 식사의 음식에서 나온 추천도 함께 사라진다.
    assert (await api_client.delete(f"/api/v1/meals/{meal_id}", headers=owner)).status_code == 204
    assert (await api_client.get(f"/api/v1/meals/{meal_id}", headers=owner)).status_code == 404
    assert (await api_client.get("/api/v1/suggestions", headers=owner)).json() == []
