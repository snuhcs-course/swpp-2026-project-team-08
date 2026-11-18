# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 아이의 제한이 가드레일까지 전달되고 위험·판정 실패 시 저장하지 않는지 검증 추가

"""실제 API·서비스·DB·그래프를 거쳐 가드레일 동작을 검증한다. LLM과 판정 모델만 가짜다."""

from httpx import AsyncClient

from app.features.suggestions.workflow.jev import JevError
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from tests.helpers.auth import auth_headers
from tests.helpers.fake_judge import ScriptedJudge
from tests.helpers.suggestions import (
    batch,
    install_judge,
    install_model,
    save_profile,
    seed_ingredient,
)
from tests.integration.test_contract_api import food


async def reviewed_meal(api_client: AsyncClient) -> tuple[dict, str, dict]:
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("쌀")
    meal = (
        await api_client.put(
            "/api/v1/meals",
            headers=owner,
            json={
                "meal_date": "2026-11-18",
                "meal_type": "LUNCH",
                "setting": "HOME",
                "foods": [food("당근볶음", "당근")],
            },
        )
    ).json()
    review = {
        "food_results": [
            {"food_id": meal["foods"][0]["id"], "outcome": "UNTOUCHED", "difficulty_reasons": []}
        ]
    }
    response = await api_client.put(
        f"/api/v1/meals/{meal['id']}/review", headers=owner, json=review
    )
    assert response.status_code == 200, response.text
    path = f"/api/v1/meals/{meal['id']}/suggestions"
    return owner, path, {"targets": [{"food_id": meal["foods"][0]["id"]}]}


async def test_the_childs_restrictions_reach_the_judge_as_readable_descriptions(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner, path, body = await reviewed_meal(api_client)
    install_model(monkeypatch, [batch("0")])
    judge = install_judge(monkeypatch, ScriptedJudge())

    response = await api_client.post(path, headers=owner, json=body)

    assert response.status_code == 201, response.text
    state, questions = judge.calls[0]
    # tests/fixtures/onboarding.py 프로필: 달걀 알러지와 채식(유제품).
    assert state["child_restrictions"] == ["달걀 알러지", "채식: 유제품을 먹지 않음"]
    assert state["suggestions"][0]["ingredients"] == ["쌀"]
    assert set(questions) == {"food0_text", "food0_ingredient0"}


async def test_a_risk_that_persists_is_not_saved_and_ends_as_a_generation_failure(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner, path, body = await reviewed_meal(api_client)
    model = install_model(monkeypatch, [batch("0")] * MAX_ATTEMPTS)
    judge = install_judge(monkeypatch, ScriptedJudge.flagging("'쌀'", probability=0.95))

    failed = await api_client.post(path, headers=owner, json=body)

    assert failed.status_code == 502
    assert failed.json()["error_code"] == "GENERATION_FAILED"
    assert len(model.compose_inputs) == len(judge.calls) == MAX_ATTEMPTS
    assert (await api_client.get(f"{path}?status=ALL", headers=owner)).json() == []


async def test_a_failing_judgement_is_a_generation_failure_and_saves_nothing(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner, path, body = await reviewed_meal(api_client)
    install_model(monkeypatch, [batch("0")])
    install_judge(monkeypatch, ScriptedJudge(error=JevError("Jev 응답 오류: HTTP 429")))

    failed = await api_client.post(path, headers=owner, json=body)

    assert failed.status_code == 502
    assert failed.json()["error_code"] == "GENERATION_FAILED"
    assert (await api_client.get(f"{path}?status=ALL", headers=owner)).json() == []
