# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: Jev Decisions API 클라이언트의 요청 형식과 오류 처리 검증 추가

"""Jev 클라이언트 테스트. 실제 API 는 호출하지 않고 httpx 의 가짜 전송을 쓴다."""

import json

import httpx
import pytest

from app.features.suggestions.workflow.jev import DECISIONS_URL, JevClient, JevError

QUESTIONS = {"cheese": "치즈가 들어 있습니까?", "nuts": "견과류가 들어 있습니까?"}


def client_with(handler) -> JevClient:
    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return JevClient("secret-key", "typesafe/jev-1.14", http=http)


def answers(**probabilities: float) -> dict:
    return {
        "model": "typesafe/jev-1.14-20261014",
        "answers": {name: {"type": "noul", "noul": value} for name, value in probabilities.items()},
    }


async def test_sends_one_noul_question_per_name_and_returns_probabilities() -> None:
    seen: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["Authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json=answers(cheese=0.93, nuts=0.04))

    result = await client_with(handler).ask({"suggestion": "x"}, QUESTIONS)

    assert result == {"cheese": 0.93, "nuts": 0.04}
    assert seen["url"] == DECISIONS_URL
    assert seen["auth"] == "Bearer secret-key"
    assert seen["body"] == {
        "model": "typesafe/jev-1.14",
        "state": {"suggestion": "x"},
        "questions": {
            "cheese": {"type": "noul", "instructions": "치즈가 들어 있습니까?"},
            "nuts": {"type": "noul", "instructions": "견과류가 들어 있습니까?"},
        },
    }


@pytest.mark.parametrize("status", [400, 401, 429, 500])
async def test_http_errors_become_jev_errors(status: int) -> None:
    client = client_with(lambda request: httpx.Response(status, text="secret-key leaked?"))

    with pytest.raises(JevError) as raised:
        await client.ask("state", QUESTIONS)

    assert str(status) in str(raised.value)
    # 응답 본문(키가 섞일 수 있음)을 오류 메시지에 싣지 않는다.
    assert "secret-key" not in str(raised.value)


async def test_network_errors_become_jev_errors() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timed out")

    with pytest.raises(JevError, match="ConnectTimeout"):
        await client_with(handler).ask("state", QUESTIONS)


@pytest.mark.parametrize(
    "payload",
    [
        {"answers": {"cheese": {"type": "noul", "noul": 0.9}}},  # nuts 누락
        {"answers": {"cheese": {"type": "choice", "choice": "a"}, "nuts": {"noul": 0.1}}},
        {"answers": {"cheese": {"noul": "abc"}, "nuts": {"noul": 0.1}}},
        {"unexpected": True},
        ["not", "an", "object"],
    ],
)
async def test_unreadable_answers_become_jev_errors(payload) -> None:
    client = client_with(lambda request: httpx.Response(200, json=payload))

    with pytest.raises(JevError):
        await client.ask("state", QUESTIONS)


async def test_non_json_response_becomes_a_jev_error() -> None:
    client = client_with(lambda request: httpx.Response(200, text="<html>"))

    with pytest.raises(JevError, match="JSON"):
        await client.ask("state", QUESTIONS)
