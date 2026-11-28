# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 아이의 제한이 가드레일까지 전달되고 위험·판정 실패 시 저장하지 않는지 검증 추가
# AI-generated with GPT-6, 2026-11-24, reviewed by Haechan Jung
# Changed: 영어 추천 fixture와 카탈로그·가짜 판정기의 재료명 일치
# AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
# Changed: 홈 화면 추천 한 장 생성 API 기준으로 변경

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
    request_suggestion,
    save_profile,
    seed_ingredient,
    stored_suggestion_names,
)

PATH = "/api/v1/suggestions"


async def owner_with_profile(api_client: AsyncClient) -> dict[str, str]:
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    return owner


async def test_the_childs_restrictions_reach_the_judge_as_readable_descriptions(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner = await owner_with_profile(api_client)
    install_model(monkeypatch, [batch()])
    judge = install_judge(monkeypatch, ScriptedJudge())

    await request_suggestion(api_client, owner)

    state, questions = judge.calls[0]
    # tests/fixtures/onboarding.py 프로필: 달걀 알러지와 채식(유제품).
    assert state["child_restrictions"] == ["달걀 알러지", "채식: 유제품을 먹지 않음"]
    assert [item["ingredients"] for item in state["suggestions"]] == [["Rice"]]
    assert set(questions) == {"suggestion0_text", "suggestion0_ingredient0"}


async def test_a_risk_that_persists_is_not_saved_and_ends_as_a_generation_failure(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner = await owner_with_profile(api_client)
    model = install_model(monkeypatch, [batch()] * MAX_ATTEMPTS)
    judge = install_judge(monkeypatch, ScriptedJudge.flagging("'Rice'", probability=0.95))

    failed = await api_client.post(PATH, headers=owner)

    assert failed.status_code == 502
    assert failed.json()["error_code"] == "GENERATION_FAILED"
    assert len(model.compose_inputs) == len(judge.calls) == MAX_ATTEMPTS
    assert await stored_suggestion_names() == []


async def test_a_failing_judgement_is_a_generation_failure_and_saves_nothing(
    api_client: AsyncClient, monkeypatch
) -> None:
    owner = await owner_with_profile(api_client)
    install_model(monkeypatch, [batch()])
    install_judge(monkeypatch, ScriptedJudge(error=JevError("Jev 응답 오류: HTTP 429")))

    failed = await api_client.post(PATH, headers=owner)

    assert failed.status_code == 502
    assert failed.json()["error_code"] == "GENERATION_FAILED"
    assert await stored_suggestion_names() == []
