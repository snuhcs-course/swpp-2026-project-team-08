# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 추천 생성 입력에 safe food, 과거 EATEN 음식, 재료별 리뷰가 실리는지 검증 추가
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 영어 추천 카탈로그 fixture 적용

"""추천 생성이 LLM에 넘기는 맥락 검증. 실제 API·서비스·SQLite를 거치고 LLM만 가짜로 바꾼다."""

import pytest
from httpx import AsyncClient
from langchain_core.messages import HumanMessage

from app.features.suggestions import familiar
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import batch, install_model, save_profile, seed_ingredient

EATEN_HEADING = "과거 식사에서 아이가 먹은 음식 (outcome: EATEN):\n"


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


async def eaten_meal(api_client: AsyncClient, headers: dict, meal_date: str, *foods: dict) -> None:
    meal = await save_meal(api_client, headers, meal_date, *foods)
    await review_meal(api_client, headers, meal, *({"outcome": "EATEN"} for _ in foods))


async def generate(api_client: AsyncClient, headers: dict, meal: dict, *food_indexes: int) -> None:
    targets = [{"food_id": meal["foods"][index]["id"]} for index in food_indexes]
    response = await api_client.post(
        f"/api/v1/meals/{meal['id']}/suggestions", headers=headers, json={"targets": targets}
    )
    assert response.status_code == 201, response.text


def user_prompt(model) -> str:
    return next(m.content for m in model.compose_inputs[0] if isinstance(m, HumanMessage))


def eaten_section(prompt: str) -> str:
    return prompt.split(EATEN_HEADING)[1].split("\n\n")[0]


@pytest.mark.asyncio
async def test_prompt_carries_reasons_safe_foods_and_past_eaten_foods(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch("0")])
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    await eaten_meal(api_client, owner, "2026-10-18", food("계란찜", "달걀"))
    meal = await save_meal(
        api_client,
        owner,
        "2026-10-20",
        food("당근 감자볶음", "당근", "감자", cooking_method="STIR_FRIED"),
        food("밥", "쌀"),
    )
    carrot = meal["foods"][0]["ingredients"][0]
    await review_meal(
        api_client,
        owner,
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
    )

    await generate(api_client, owner, meal, 0)

    prompt = user_prompt(model)
    # 아이가 어려워한 이유: 음식 전체와, 따로 리뷰한 재료.
    assert "difficulty_reasons: TEXTURE.HARDNESS.HARD" in prompt
    assert "당근 (outcome: UNTOUCHED, difficulty_reasons: SMELL.SULFUR)" in prompt
    # 리뷰하지 않은 재료는 결과로 싣지 않는다.
    assert "감자 (outcome" not in prompt
    # 프로필의 safe food 는 기록된 조리·제공 형태와 함께 실린다.
    assert "- 감자, cooking: 푹 삶기, note: 작게 잘라 제공" in prompt
    assert "- 쌀밥, cooking: 질게 짓기" in prompt
    # 과거 식사와 같은 식사에서 잘 먹은 음식도 실린다. 이번에 제안할 음식 자신은 뺀다.
    eaten = eaten_section(prompt)
    assert "- 계란찜, cooking_method: STEAMED, ingredients: 달걀" in eaten
    assert "- 밥, cooking_method: STEAMED, ingredients: 쌀" in eaten
    assert "당근 감자볶음" not in eaten


@pytest.mark.asyncio
async def test_same_named_eaten_foods_are_listed_once_with_the_latest_form(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch("0")])
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    await eaten_meal(
        api_client, owner, "2026-10-16", food("계란찜", "달걀", cooking_method="BOILED")
    )
    await eaten_meal(api_client, owner, "2026-10-18", food("계란찜", "달걀"))
    meal = await save_meal(api_client, owner, "2026-10-20", food("당근볶음", "당근"))
    await review_meal(api_client, owner, meal, {"outcome": "UNTOUCHED"})

    await generate(api_client, owner, meal, 0)

    eaten = eaten_section(user_prompt(model))
    assert eaten.count("계란찜") == 1
    assert "cooking_method: STEAMED" in eaten
    assert "BOILED" not in eaten


@pytest.mark.asyncio
async def test_only_the_most_recent_eaten_foods_are_listed(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(familiar, "EATEN_FOOD_LIMIT", 2)
    model = install_model(monkeypatch, [batch("0")])
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await seed_ingredient("Rice")
    await eaten_meal(api_client, owner, "2026-10-14", food("가장 오래된 음식", "쌀"))
    await eaten_meal(api_client, owner, "2026-10-16", food("중간 음식", "쌀"))
    await eaten_meal(api_client, owner, "2026-10-18", food("최근 음식", "쌀"))
    meal = await save_meal(api_client, owner, "2026-10-20", food("당근볶음", "당근"))
    await review_meal(api_client, owner, meal, {"outcome": "UNTOUCHED"})

    await generate(api_client, owner, meal, 0)

    eaten = eaten_section(user_prompt(model))
    assert "최근 음식" in eaten and "중간 음식" in eaten
    assert "가장 오래된 음식" not in eaten
    assert eaten.index("최근 음식") < eaten.index("중간 음식")


@pytest.mark.asyncio
async def test_other_users_records_never_reach_the_prompt(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch("0")])
    owner = await auth_headers(api_client, "owner@example.com")
    stranger = await auth_headers(api_client, "stranger@example.com")
    await save_profile(api_client, owner)
    other = request_body()
    other["profile"]["safe_foods"] = [
        {"name": "남의 safe food", "preparation": None, "presentation_note": None}
    ]
    assert (
        await api_client.put("/api/v1/onboarding", headers=stranger, json=other)
    ).status_code == 200
    await eaten_meal(api_client, stranger, "2026-10-18", food("남이 잘 먹은 음식", "쌀"))
    await seed_ingredient("Rice")
    meal = await save_meal(api_client, owner, "2026-10-20", food("당근볶음", "당근"))
    await review_meal(api_client, owner, meal, {"outcome": "UNTOUCHED"})

    await generate(api_client, owner, meal, 0)

    prompt = user_prompt(model)
    assert "남의 safe food" not in prompt
    assert "남이 잘 먹은 음식" not in prompt
    assert EATEN_HEADING not in prompt


@pytest.mark.asyncio
async def test_generation_works_when_nothing_is_known_about_what_the_child_eats_well(
    api_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    model = install_model(monkeypatch, [batch("0")])
    owner = await auth_headers(api_client, "owner@example.com")
    body = request_body()
    body["profile"]["safe_foods"] = []
    assert (await api_client.put("/api/v1/onboarding", headers=owner, json=body)).status_code == 200
    await seed_ingredient("Rice")
    meal = await save_meal(api_client, owner, "2026-10-20", food("당근볶음", "당근"))
    await review_meal(api_client, owner, meal, {"outcome": "UNTOUCHED"})

    await generate(api_client, owner, meal, 0)

    prompt = user_prompt(model)
    assert "아이가 평소 잘 먹는 음식" not in prompt
    assert EATEN_HEADING not in prompt
