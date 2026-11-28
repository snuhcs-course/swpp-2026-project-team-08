# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 추천 생성 입력에 safe food, 과거 EATEN 음식, 재료별 리뷰가 실리는지 검증 추가
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 이유·결과·조리법이 설명으로 풀려 프롬프트에 실리는지 검증

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 영어 추천 카탈로그 fixture 적용

# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 식사별 생성 API 없이 사용자별 추천 근거 조회 검증
"""프로필과 식사 기록에서 읽는 추천 근거를 실제 SQLite로 검증한다."""

from httpx import AsyncClient

from app.features.suggestions import familiar
from tests.fixtures.onboarding import request_body
from tests.helpers.auth import auth_headers
from tests.helpers.suggestions import save_profile


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


async def familiar_foods(api_client, headers, session_factory):
    profile = (await api_client.get("/api/v1/onboarding", headers=headers)).json()["profile"]
    async with session_factory() as session:
        return await familiar.load_familiar_foods(session, int(profile["user_id"]))


async def test_reads_safe_foods_and_reviewed_eaten_foods(api_client, session_factory):
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await eaten_meal(api_client, owner, "2026-10-18", food("계란찜", "달걀"))
    meal = await save_meal(api_client, owner, "2026-10-20", food("볶음", "당근"), food("밥", "쌀"))
    await review_meal(api_client, owner, meal, {"outcome": "UNTOUCHED"}, {"outcome": "EATEN"})

    data = await familiar_foods(api_client, owner, session_factory)
    assert [(f.name, f.preparation, f.presentation_note) for f in data.safe_foods] == [
        ("감자", "푹 삶기", "작게 잘라 제공"),
        ("쌀밥", "질게 짓기", None),
    ]
    assert [(f.name, f.cooking_method, f.ingredients) for f in data.eaten_foods] == [
        ("밥", "STEAMED", ("쌀",)),
        ("계란찜", "STEAMED", ("달걀",)),
    ]


async def test_same_named_eaten_foods_are_listed_once_with_the_latest_form(
    api_client, session_factory
):
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await eaten_meal(
        api_client, owner, "2026-10-16", food("계란찜", "달걀", cooking_method="BOILED")
    )
    await eaten_meal(api_client, owner, "2026-10-18", food("계란찜", "달걀"))
    data = await familiar_foods(api_client, owner, session_factory)
    assert [(f.name, f.cooking_method) for f in data.eaten_foods] == [("계란찜", "STEAMED")]


async def test_only_the_most_recent_eaten_foods_are_listed(
    api_client, session_factory, monkeypatch
):
    monkeypatch.setattr(familiar, "EATEN_FOOD_LIMIT", 2)
    owner = await auth_headers(api_client, "owner@example.com")
    await save_profile(api_client, owner)
    await eaten_meal(api_client, owner, "2026-10-14", food("가장 오래된 음식", "쌀"))
    await eaten_meal(api_client, owner, "2026-10-16", food("중간 음식", "쌀"))
    await eaten_meal(api_client, owner, "2026-10-18", food("최근 음식", "쌀"))
    data = await familiar_foods(api_client, owner, session_factory)
    assert [f.name for f in data.eaten_foods] == ["최근 음식", "중간 음식"]


async def test_other_users_records_are_excluded(api_client, session_factory):
    owner = await auth_headers(api_client, "owner@example.com")
    stranger = await auth_headers(api_client, "stranger@example.com")
    body = request_body()
    body["profile"]["safe_foods"] = []
    assert (await api_client.put("/api/v1/onboarding", headers=owner, json=body)).status_code == 200
    await save_profile(api_client, stranger)
    await eaten_meal(api_client, stranger, "2026-10-18", food("남이 잘 먹은 음식", "쌀"))
    data = await familiar_foods(api_client, owner, session_factory)
    assert data == familiar.FamiliarFoods()
