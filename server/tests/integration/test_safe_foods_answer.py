# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 익숙한 음식 목록·명시적 없음·미응답 저장 구분 검증

"""Safe Foods 응답을 저장하고 새 요청에서 그대로 읽는다."""

import pytest

from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers


@pytest.mark.asyncio
async def test_safe_foods_answer_round_trip_and_replacement(api_client):
    headers = await auth_headers(api_client, "safe-foods@example.com")
    food = {"name": "Apple", "preparation": "Sliced and warmed", "presentation_note": "Blue bowl"}
    for answer in [[food], None, [], [food]]:
        body = request_body()
        body["profile"]["safe_foods"] = answer
        written = await api_client.put("/api/v1/onboarding", headers=headers, json=body)
        assert written.status_code == 200, written.text
        saved = written.json()["profile"]["safe_foods"]
        if answer:
            assert [
                {key: value for key, value in item.items() if key != "id"} for item in saved
            ] == answer
        else:
            assert saved == answer
        loaded = await api_client.get("/api/v1/onboarding", headers=headers)
        assert loaded.json()["profile"]["safe_foods"] == saved
