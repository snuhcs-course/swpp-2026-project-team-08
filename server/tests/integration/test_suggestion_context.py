# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 제거에 따른 검증 갱신
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 추천 문맥 검증
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 추천 생성 입력에 safe food, 과거 EATEN 음식, 재료별 리뷰가 실리는지 검증 추가
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 이유·결과·조리법이 설명으로 풀려 프롬프트에 실리는지 검증

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 영어 추천 카탈로그 fixture 적용
# AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
# Changed: 홈 화면 추천의 연령대·편식 가설·잘 먹은 음식·거부 음식·추천 이력 입력 검증으로 재작성

"""추천 생성이 LLM에 넘기는 맥락 검증. 실제 API·서비스·SQLite를 거치고 LLM만 가짜로 바꾼다."""

import pytest
from httpx import AsyncClient
from langchain_core.messages import HumanMessage

from app.features.suggestions import difficulties, familiar
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import (
    batch,
    install_model,
    request_suggestions,
    save_profile,
    seed_ingredient,
)

DIFFICULT_HEADING = "잘 먹지 못한 음식 (어려워한 이유는 보호자가 추정한 가설):\n"
EATEN_HEADING = "과거 식사에서 아이가 잘 먹은 음식 (식후 리뷰에 '잘 먹었다'로 기록):\n"
HISTORY_HEADING = "지금까지 추천한 음식 (같은 음식은 다시 추천하지 않음):\n"


def food(name: str, *ingredients: str, cooking_method: str = "STEAMED") -> dict:
    return {
        "name": name,
        "ingredients": [{"name": item} for item in ingredients],
        "cooking_method": cooking_method,
        "serving_note": None,
        "acceptance": 1,
    }


async def save_meal(api_client: AsyncClient, headers: dict, meal_date: str, *foods: dict) -> dict:
    response = await api_client.put(
        "/api/v1/meals",
        headers=headers,
        json={
            "meal_date": meal_date,
            "meal_type": "LUNCH",
            "setting": "HOME",
            "foods": list(foods),
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


async def review_meal(api_client: AsyncClient, headers: dict, meal: dict, *results: dict) -> dict:
    """식사의 음식마다 순서대로 리뷰 결과를 넣는다. 결과에는 outcome 만 있어도 된다."""
    food_results = [
        {"difficulty_reasons": [], **result, "food_id": item["id"]}
        for item, result in zip(meal["foods"], results, strict=True)
    ]
    response = await api_client.put(
        f"/api/v1/meals/{meal['id']}/review",
        headers=headers,
        json={"after_photo_uri": None, "food_results": food_results},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def reviewed_meal(
    api_client: AsyncClient, headers: dict, meal_date: str, outcome: str, *foods: dict
) -> None:
    """모든 음식의 결과가 `outcome` 인 식사를 저장한다."""
    meal = await save_meal(api_client, headers, meal_date, *foods)
    await review_meal(api_client, headers, meal, *({"outcome": outcome} for _ in foods))


async def owner(api_client: AsyncClient) -> dict:
    headers = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, headers)
    await seed_ingredient("Rice")
    return headers


def user_prompt(model, call: int = 0) -> str:
    return next(m.content for m in model.compose_inputs[call] if isinstance(m, HumanMessage))


def section(prompt: str, heading: str) -> str:
    return prompt.split(heading)[1].split("\n\n")[0]


@pytest.mark.asyncio
async def test_prompt_carries_age_reasons_and_what_the_child_eats_well(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch()])
    headers = await owner(api_client)
    await reviewed_meal(api_client, headers, "2026-10-18", "EATEN", food("계란찜", "달걀"))
    meal = await save_meal(
        api_client,
        headers,
        "2026-10-20",
        food("당근 감자볶음", "당근", "감자", cooking_method="STIR_FRIED"),
        food("밥", "쌀"),
        food("시금치나물", "시금치"),
    )
    carrot = meal["foods"][0]["ingredients"][0]
    await review_meal(
        api_client,
        headers,
        meal,
        {
            "outcome": "UNTOUCHED",
            "difficulty_reasons": ["TEXTURE.HARDNESS.HARD"],
            "ingredient_outcomes": [
                {
                    "ingredient_id": carrot["id"],
                    "outcome": "UNTOUCHED",
                    "difficulty_reasons": ["SMELL.SULFUR"],
                }
            ],
        },
        {"outcome": "EATEN"},
        {"outcome": "TASTED", "difficulty_reasons": ["COLOR.GREEN"]},
    )

    await request_suggestions(api_client, headers)

    prompt = user_prompt(model)
    assert "- 연령대: 만 4~5세" in prompt
    # 편식 성향 가설: 잘 먹지 못한 음식과 보호자가 추정한 이유. 음식 전체와 따로 리뷰한 재료.
    difficult = section(prompt, DIFFICULT_HEADING)
    assert (
        "- name: 시금치나물, ingredients: 시금치, cooking_method: 찌기, "
        "outcome: 맛만 보고 더 먹지 않았다, difficulty_reasons: 색이 초록색이어서"
    ) in difficult
    assert "difficulty_reasons: 식감이 딱딱하고 단단해서" in difficult
    assert (
        "당근 (outcome: 입에 대지 않았다, difficulty_reasons: 달걀·양배추류 같은 유황 냄새가 나서)"
        in difficult
    )
    # 리뷰하지 않은 재료는 결과로 싣지 않고, 잘 먹은 음식은 가설에 넣지 않는다.
    assert "감자 (outcome" not in difficult
    assert "name: 밥" not in difficult and "계란찜" not in difficult
    # 과거와 최근 식사에서 잘 먹은 음식도 실린다.
    eaten = section(prompt, EATEN_HEADING)
    assert "- 밥, cooking_method: 찌기, ingredients: 쌀" in eaten
    assert "- 계란찜, cooking_method: 찌기, ingredients: 달걀" in eaten
    for code in ("AGE_4_5", "TEXTURE.HARDNESS", "SMELL.SULFUR", "UNTOUCHED", "STEAMED"):
        assert code not in prompt


@pytest.mark.asyncio
async def test_unreviewed_foods_are_not_treated_as_difficult(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch()])
    headers = await owner(api_client)
    await save_meal(api_client, headers, "2026-10-20", food("당근볶음", "당근"))

    await request_suggestions(api_client, headers)

    assert DIFFICULT_HEADING not in user_prompt(model)


@pytest.mark.asyncio
async def test_same_named_foods_are_listed_once_with_the_latest_record(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch()])
    headers = await owner(api_client)
    old = food("계란찜", "달걀", cooking_method="BOILED")
    await reviewed_meal(api_client, headers, "2026-10-16", "EATEN", old)
    await reviewed_meal(api_client, headers, "2026-10-18", "EATEN", food("계란찜", "달걀"))
    await reviewed_meal(api_client, headers, "2026-10-16", "UNTOUCHED", food("브로콜리", "쌀"))
    await reviewed_meal(api_client, headers, "2026-10-18", "TASTED", food(" 브로콜리 ", "쌀"))

    await request_suggestions(api_client, headers)

    prompt = user_prompt(model)
    eaten = section(prompt, EATEN_HEADING)
    assert eaten.count("계란찜") == 1
    assert "cooking_method: 찌기" in eaten and "삶거나 끓이기" not in eaten
    difficult = section(prompt, DIFFICULT_HEADING)
    assert difficult.count("브로콜리") == 1
    assert "맛만 보고 더 먹지 않았다" in difficult


@pytest.mark.asyncio
async def test_only_the_most_recent_records_are_listed(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(familiar, "EATEN_FOOD_LIMIT", 2)
    monkeypatch.setattr(difficulties, "DIFFICULT_FOOD_LIMIT", 2)
    model = install_model(monkeypatch, [batch()])
    headers = await owner(api_client)
    for outcome, prefix in (("EATEN", "잘 먹은"), ("UNTOUCHED", "못 먹은")):
        await reviewed_meal(api_client, headers, "2026-10-14", outcome, food(f"{prefix} 옛 음식"))
        await reviewed_meal(api_client, headers, "2026-10-16", outcome, food(f"{prefix} 중간 음식"))
        await reviewed_meal(api_client, headers, "2026-10-18", outcome, food(f"{prefix} 최근 음식"))

    await request_suggestions(api_client, headers)

    prompt = user_prompt(model)
    for heading, prefix in ((EATEN_HEADING, "잘 먹은"), (DIFFICULT_HEADING, "못 먹은")):
        listed = section(prompt, heading)
        assert f"{prefix} 옛 음식" not in listed
        assert listed.index(f"{prefix} 최근 음식") < listed.index(f"{prefix} 중간 음식")


@pytest.mark.asyncio
async def test_history_carries_every_past_recommendation_and_dismiss_reasons(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch(), batch("Rice salad", "Rice soup", "Fried rice")])
    headers = await owner(api_client)
    first = await request_suggestions(api_client, headers)
    dismissed = await api_client.put(
        f"/api/v1/suggestions/{first[0]['id']}/decision",
        headers=headers,
        json={"status": "DISMISSED", "dismiss_reasons": ["TOO_MUCH_PREPARATION", "DISLIKE"]},
    )
    assert dismissed.status_code == 200, dismissed.text
    saved = await api_client.put(
        f"/api/v1/suggestions/{first[1]['id']}/decision",
        headers=headers,
        json={"status": "SAVED"},
    )
    assert saved.status_code == 200, saved.text

    await request_suggestions(api_client, headers)

    assert HISTORY_HEADING not in user_prompt(model, 0)
    history = section(user_prompt(model, 1), HISTORY_HEADING)
    assert (
        "- Rice porridge, decision: 보호자가 거절했다, "
        "dismiss_reasons: 준비가 너무 번거로워서 / 아이가 싫어할 것 같아서"
    ) in history
    assert "- Rice ball, decision: 보호자가 저장했다" in history
    assert "- Rice cake, decision: 보호자가 아직 결정하지 않았다" in history


@pytest.mark.asyncio
async def test_other_users_records_never_reach_the_prompt(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch("Stranger dish 1", "Stranger dish 2", "X"), batch()])
    headers = await owner(api_client)
    stranger = await auth_headers(api_client, "stranger@example.com")
    other = request_body()
    assert (
        await api_client.put("/api/v1/onboarding", headers=stranger, json=other)
    ).status_code == 200
    await reviewed_meal(api_client, stranger, "2026-10-18", "EATEN", food("남이 잘 먹은 음식"))
    await reviewed_meal(api_client, stranger, "2026-10-18", "UNTOUCHED", food("남이 못 먹은 음식"))
    await request_suggestions(api_client, stranger)

    await request_suggestions(api_client, headers)

    prompt = user_prompt(model, 1)
    for text in ("남이 잘 먹은 음식", "남이 못 먹은 음식", "Stranger dish"):
        assert text not in prompt
    for heading in (EATEN_HEADING, DIFFICULT_HEADING, HISTORY_HEADING):
        assert heading not in prompt


@pytest.mark.asyncio
async def test_age_and_restrictions_alone_are_enough_to_recommend(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch()])
    headers = await auth_headers(api_client, "owner@example.com")
    assert (
        await api_client.put("/api/v1/onboarding", headers=headers, json=request_body())
    ).status_code == 200
    await seed_ingredient("Rice")

    created = await request_suggestions(api_client, headers)

    assert len(created) == 3
    prompt = user_prompt(model)
    assert "- 연령대: 만 4~5세" in prompt
    for heading in ("잘 먹지 못한 음식", "과거 식사에서", "아이가 거부한 음식", "지금까지"):
        assert heading not in prompt


@pytest.mark.asyncio
async def test_refused_foods_are_included_in_suggestion_context(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch()])
    headers = await auth_headers(api_client, "refused-context@example.com")
    payload = request_body()
    payload["profile"]["refused_foods"] = [
        {
            "id": "one",
            "name": "Apple",
            "cooking_method": "STEAMED",
            "reasons": ["TEXTURE.HARDNESS.HARD"],
        }
    ]
    response = await api_client.put("/api/v1/onboarding", headers=headers, json=payload)
    assert response.status_code == 200, response.text
    await seed_ingredient("Rice")

    await request_suggestions(api_client, headers)

    prompt = user_prompt(model)
    assert (
        "아이가 거부한 음식 (보호자 기록, 이유는 보호자가 추정한 가설):\n"
        "- Apple, cooking_method: 찌기, difficulty_reasons: 식감이 딱딱하고 단단해서"
    ) in prompt
    assert "TEXTURE.HARDNESS.HARD" not in prompt
