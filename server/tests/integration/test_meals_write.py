# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Verify isolated check-in ingredients and atomic meal writes
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 서버 발급 id·음식 안 리뷰 결과·추천 시도·난이도 사유 문자열 기준으로 재작성
# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: main 테스트 유지 및 api_client·공통 fixture 정리

"""인증된 식사 저장·수정·리뷰·삭제와 추천 시도 연결."""

from datetime import date
from pathlib import Path
from runpy import run_path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from httpx import AsyncClient
from sqlalchemy import create_engine, select, text

from app.core.database import get_session
from app.core.timezone import now_kst
from app.main import app
from app.models import (
    FoodRecommendation,
    FoodRecommendationTry,
    Meal,
    MealFood,
    MealFoodIngredient,
)
from app.models.food_recommendation_enums import FoodRecommendationStatus
from app.models.meal_enums import MealCookingMethod, MealSetting, MealType
from tests.fixtures.meals import food_payload, meal_payload
from tests.helpers.auth import auth_headers


def test_meal_migration_keeps_legacy_food_rows() -> None:
    migration = run_path(
        str(
            Path(__file__).resolve().parents[2]
            / "migrations/versions/20261021_1400_authenticated_meals.py"
        )
    )
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE meal_foods (meal_id TEXT, id TEXT)"))
        connection.execute(text("CREATE INDEX ix_meal_foods_meal_id ON meal_foods(meal_id)"))
        connection.execute(text("INSERT INTO meal_foods VALUES ('old-meal', 'old-food')"))
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            migration["upgrade"]()
        assert connection.execute(text("SELECT * FROM legacy_meal_foods")).all() == [
            ("old-meal", "old-food")
        ]
        with Operations.context(context):
            migration["downgrade"]()
        assert connection.execute(text("SELECT * FROM meal_foods")).all() == [
            ("old-meal", "old-food")
        ]
    engine.dispose()


def without_saved_at(meal: dict) -> dict:
    return {key: value for key, value in meal.items() if key != "saved_at"}


async def save_meal(api_client: AsyncClient, headers: dict, payload: dict | None = None) -> dict:
    response = await api_client.put(
        "/api/v1/meals", headers=headers, json=payload or meal_payload()
    )
    assert response.status_code == 200, response.text
    return response.json()


async def seed_recommendation(
    user_id: int, status: FoodRecommendationStatus = FoodRecommendationStatus.SAVED
) -> int:
    """추천이 근거로 삼은 음식(별도 식사)과 함께 추천 하나를 만들고 id 를 돌려준다."""
    async for session in app.dependency_overrides[get_session]():
        meal = Meal(
            user_id=user_id,
            meal_date=date(2026, 10, 1),
            meal_type=MealType.LUNCH,
            setting=MealSetting.HOME,
            saved_at=now_kst(),
        )
        session.add(meal)
        await session.flush()
        origin = MealFood(meal_id=meal.id, name="근거 음식")
        session.add(origin)
        await session.flush()
        recommendation = FoodRecommendation(
            user_id=user_id,
            origin_food_id=origin.id,
            what_to_try="감자 조리법 바꾸기",
            why_this_may_help="새로운 식감 제공",
            ingredients=["감자"],
            cooking_method=MealCookingMethod.STEAMED,
            causes="질감이 어려웠다",
            status=status,
            saved_at=now_kst(),
        )
        session.add(recommendation)
        await session.flush()
        # 루프 안에서 return 하면 세션이 커밋되기 전에 닫히므로 id 만 담고 루프를 끝낸다.
        recommendation_id = recommendation.id
    return recommendation_id


async def count_rows(model: type) -> int:
    async for session in app.dependency_overrides[get_session]():
        return len((await session.scalars(select(model))).all())
    raise AssertionError("session was not provided")


@pytest.mark.asyncio
async def test_write_meal_returns_server_issued_ids_for_foods_and_ingredients(
    api_client: AsyncClient,
) -> None:
    assert (await api_client.put("/api/v1/meals", json=meal_payload())).status_code == 401
    headers = await auth_headers(api_client, "meal@example.com")
    body = await save_meal(
        api_client, headers, meal_payload(food_payload("감자볶음", "감자", "당근"))
    )
    assert body["user_id"] == "1" and body["id"].isdecimal()
    assert body["meal_type"] == "LUNCH" and body["setting"] == "HOME"
    assert body["after_photo_uri"] is None and body["saved_at"]
    food = body["foods"][0]
    assert food["id"].isdecimal() and food["meal_id"] == body["id"]
    assert food["cooking_method"] == "STIR_FRIED"
    assert food["outcome"] is None and food["difficulty_reasons"] == []
    assert food["recommendation_tries"] == []
    assert [item["name"] for item in food["ingredients"]] == ["감자", "당근"]
    assert all(item["id"].isdecimal() for item in food["ingredients"])
    assert all(item["outcome"] is None for item in food["ingredients"])
    # SQLite 는 시간대를 저장하지 않으므로 saved_at 은 비교에서 뺀다.
    detail = (await api_client.get(f"/api/v1/meals/{body['id']}", headers=headers)).json()
    listed = (await api_client.get("/api/v1/meals", headers=headers)).json()
    assert without_saved_at(detail) == without_saved_at(body)
    assert [without_saved_at(item) for item in listed] == [without_saved_at(body)]


@pytest.mark.asyncio
async def test_ingredients_are_stored_as_typed_per_food(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "meal@example.com")
    payload = meal_payload(
        food_payload("국", "  우리집   양념  "), food_payload("볶음", "우리집 양념")
    )
    body = await save_meal(api_client, headers, payload)
    first, second = (food["ingredients"][0] for food in body["foods"])
    assert first["name"] == "우리집 양념" and second["name"] == "우리집 양념"
    # 같은 이름도 음식마다 별도 행이며 id 가 다르다.
    assert first["id"] != second["id"]
    assert await count_rows(MealFoodIngredient) == 2


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "change",
    [
        lambda p: p.update(meal_type="lunch"),
        lambda p: p.update(setting="home"),
        lambda p: p["foods"][0].update(cooking_method="stir_fried"),
        lambda p: p["foods"][0].update(id="1"),
        lambda p: p["foods"][0]["ingredients"][0].update(id="212"),
        lambda p: p.update(suggestion_links=[]),
        lambda p: p.update(foods=[]),
    ],
    ids=[
        "lowercase-type",
        "lowercase-setting",
        "lowercase-cooking-method",
        "api_client-food-id",
        "api_client-ingredient-id",
        "old-suggestion-links",
        "no-foods",
    ],
)
async def test_invalid_meal_payload_is_rejected_without_saving(
    api_client: AsyncClient, change
) -> None:
    headers = await auth_headers(api_client, "meal@example.com")
    payload = meal_payload()
    change(payload)
    response = await api_client.put("/api/v1/meals", headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    assert await count_rows(Meal) == 0


@pytest.mark.asyncio
async def test_duplicate_ingredient_in_one_food_rolls_back_the_meal(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "rollback@example.com")
    payload = meal_payload(food_payload("볶음", "Custom spice", " custom   SPICE "))
    response = await api_client.put("/api/v1/meals", headers=headers, json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["error_code"] == "DUPLICATE_INGREDIENT"
    assert await count_rows(Meal) == 0 and await count_rows(MealFood) == 0


@pytest.mark.asyncio
async def test_write_meal_links_saved_recommendations_to_the_food(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "meal@example.com")
    recommendation_id = await seed_recommendation(1)
    payload = meal_payload(food_payload(), food_payload("국", "무"))
    payload["foods"][0]["food_recommendation_ids"] = [str(recommendation_id)]
    body = await save_meal(api_client, headers, payload)
    tried, other = body["foods"]
    assert other["recommendation_tries"] == []
    assert len(tried["recommendation_tries"]) == 1
    attempt = tried["recommendation_tries"][0]
    assert attempt["food_recommendation_id"] == str(recommendation_id)
    assert attempt["feedback"] is None
    assert attempt["recommendation"]["what_to_try"] == "감자 조리법 바꾸기"
    async for session in app.dependency_overrides[get_session]():
        stored = (await session.scalars(select(FoodRecommendationTry))).all()
        assert [(item.food_recommendation_id, item.food_id) for item in stored] == [
            (recommendation_id, int(tried["id"]))
        ]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "case", ["missing", "pending", "other-user", "two-foods"], ids=lambda value: value
)
async def test_invalid_recommendation_link_is_rejected_without_saving(
    api_client: AsyncClient, case: str
) -> None:
    headers = await auth_headers(api_client, "meal@example.com")
    await auth_headers(api_client, "other@example.com")
    if case == "missing":
        ids = ["9999"]
    elif case == "pending":
        ids = [str(await seed_recommendation(1, FoodRecommendationStatus.PENDING))]
    elif case == "other-user":
        ids = [str(await seed_recommendation(2))]
    else:
        ids = [str(await seed_recommendation(1))]
    payload = meal_payload(food_payload(), food_payload("국", "무"))
    payload["foods"][0]["food_recommendation_ids"] = ids
    if case == "two-foods":
        payload["foods"][1]["food_recommendation_ids"] = ids
    meals_before = await count_rows(Meal)
    response = await api_client.put("/api/v1/meals", headers=headers, json=payload)
    assert response.status_code == 422, response.text
    expected = "VALIDATION_ERROR" if case == "two-foods" else "INVALID_MEAL_LINK"
    assert response.json()["error_code"] == expected
    assert await count_rows(Meal) == meals_before
    assert await count_rows(FoodRecommendationTry) == 0


@pytest.mark.asyncio
async def test_update_foods_matches_existing_foods_by_id(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "edit@example.com")
    saved = await save_meal(
        api_client,
        headers,
        meal_payload(food_payload("감자볶음", "감자"), food_payload("국", "무")),
    )
    keep, drop = saved["foods"]
    edited = {
        "foods": [
            {**food_payload("감자와 당근", "감자", "당근"), "id": keep["id"]},
            food_payload("새 음식", "두부"),
        ]
    }
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/foods", headers=headers, json=edited
    )
    assert response.status_code == 200, response.text
    foods = response.json()["foods"]
    assert [food["name"] for food in foods] == ["감자와 당근", "새 음식"]
    # 요청에 id 를 보낸 음식은 같은 음식으로 남고, 빠진 음식은 사라지며, id 없는 음식은 새로 만든다.
    assert foods[0]["id"] == keep["id"]
    assert drop["name"] not in {food["name"] for food in foods}
    assert [item["name"] for item in foods[0]["ingredients"]] == ["감자", "당근"]
    assert await count_rows(MealFood) == 2
    assert await count_rows(MealFoodIngredient) == 3


@pytest.mark.asyncio
async def test_update_foods_deletes_the_recommendation_tries_of_omitted_foods(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "edit@example.com")
    recommendation_id = await seed_recommendation(1)
    payload = meal_payload(food_payload(), food_payload("국", "무"))
    payload["foods"][1]["food_recommendation_ids"] = [str(recommendation_id)]
    saved = await save_meal(api_client, headers, payload)
    keep = saved["foods"][0]
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/foods",
        headers=headers,
        json={"foods": [{**food_payload(), "id": keep["id"]}]},
    )
    assert response.status_code == 200, response.text
    assert await count_rows(FoodRecommendationTry) == 0
    async for session in app.dependency_overrides[get_session]():
        assert await session.get(FoodRecommendation, recommendation_id) is not None


@pytest.mark.asyncio
async def test_update_foods_keeps_the_recommendation_tries_of_kept_foods(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "edit@example.com")
    recommendation_id = await seed_recommendation(1)
    payload = meal_payload()
    payload["foods"][0]["food_recommendation_ids"] = [str(recommendation_id)]
    saved = await save_meal(api_client, headers, payload)
    food = saved["foods"][0]
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/foods",
        headers=headers,
        json={"foods": [{**food_payload("이름 변경", "당근"), "id": food["id"]}]},
    )
    assert response.status_code == 200, response.text
    updated = response.json()["foods"][0]
    assert updated["name"] == "이름 변경"
    assert [item["food_recommendation_id"] for item in updated["recommendation_tries"]] == [
        str(recommendation_id)
    ]


@pytest.mark.asyncio
async def test_update_foods_rejects_unknown_or_foreign_food_ids(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "edit@example.com")
    first = await save_meal(api_client, headers)
    second = await save_meal(api_client, headers)
    before = (await api_client.get(f"/api/v1/meals/{first['id']}", headers=headers)).json()
    for food_id in ("9999", second["foods"][0]["id"]):
        response = await api_client.put(
            f"/api/v1/meals/{first['id']}/foods",
            headers=headers,
            json={"foods": [{**food_payload(), "id": food_id}]},
        )
        assert response.status_code == 422, response.text
        assert response.json()["error_code"] == "INVALID_MEAL_FOOD"
    assert (await api_client.get(f"/api/v1/meals/{first['id']}", headers=headers)).json() == before


@pytest.mark.asyncio
async def test_update_foods_rejects_duplicate_ingredients_and_preserves_the_meal(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "edit-rollback@example.com")
    saved = await save_meal(api_client, headers)
    url = f"/api/v1/meals/{saved['id']}"
    before = (await api_client.get(url, headers=headers)).json()
    edited = {"foods": [{**food_payload("Must not persist", "Spice", "spice"), "id": None}]}
    rejected = await api_client.put(f"{url}/foods", headers=headers, json=edited)
    assert rejected.status_code == 422, rejected.text
    assert rejected.json()["error_code"] == "DUPLICATE_INGREDIENT"
    assert (await api_client.get(url, headers=headers)).json() == before


@pytest.mark.asyncio
@pytest.mark.parametrize("ingredient_name", ["", " \t\n"])
async def test_blank_ingredient_update_preserves_existing_meal(api_client, ingredient_name):
    headers = await auth_headers(api_client, "recover@example.com")
    saved = await save_meal(api_client, headers)
    url = f"/api/v1/meals/{saved['id']}"
    before = (await api_client.get(url, headers=headers)).json()
    invalid = food_payload("Must not persist", ingredient_name)
    rejected = await api_client.put(f"{url}/foods", headers=headers, json={"foods": [invalid]})
    assert rejected.status_code == 422
    assert rejected.json()["error_code"] == "VALIDATION_ERROR"
    assert (await api_client.get(url, headers=headers)).json() == before


def review_payload(meal: dict, **overrides) -> dict:
    return {
        "after_photo_uri": None,
        "food_results": [
            {
                "food_id": food["id"],
                "outcome": "EATEN",
                "difficulty_reasons": [],
                "ingredient_outcomes": [],
                **overrides,
            }
            for food in meal["foods"]
        ],
    }


@pytest.mark.asyncio
async def test_review_stores_results_inside_foods_and_ingredients(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "review@example.com")
    saved = await save_meal(api_client, headers, meal_payload(food_payload("볶음", "감자", "당근")))
    food = saved["foods"][0]
    potato, carrot = food["ingredients"]
    payload = {
        "after_photo_uri": "file:///after.png",
        "food_results": [
            {
                "food_id": food["id"],
                "outcome": "TASTED",
                "difficulty_reasons": ["TEXTURE.HARDNESS.SOFT", "COLOR.WHITE"],
                "ingredient_outcomes": [
                    {
                        "ingredient_id": potato["id"],
                        "outcome": "UNTOUCHED",
                        "difficulty_reasons": ["SMELL.SULFUR"],
                    }
                ],
            }
        ],
    }
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/review", headers=headers, json=payload
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["after_photo_uri"] == "file:///after.png"
    reviewed = body["foods"][0]
    assert reviewed["outcome"] == "TASTED"
    assert reviewed["difficulty_reasons"] == ["TEXTURE.HARDNESS.SOFT", "COLOR.WHITE"]
    by_name = {item["name"]: item for item in reviewed["ingredients"]}
    assert by_name["감자"]["outcome"] == "UNTOUCHED"
    assert by_name["감자"]["difficulty_reasons"] == ["SMELL.SULFUR"]
    # 요청에 없는 재료는 아직 리뷰하지 않은 상태로 남는다.
    assert by_name["당근"]["id"] == carrot["id"] and by_name["당근"]["outcome"] is None
    assert "review" not in body and "food_results" not in body
    detail = (await api_client.get(f"/api/v1/meals/{saved['id']}", headers=headers)).json()
    assert without_saved_at(detail) == without_saved_at(body)


@pytest.mark.asyncio
async def test_review_can_be_replaced_and_resets_omitted_ingredients(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client, "review@example.com")
    saved = await save_meal(api_client, headers)
    food = saved["foods"][0]
    url = f"/api/v1/meals/{saved['id']}/review"
    first = review_payload(saved)
    first["food_results"][0]["ingredient_outcomes"] = [
        {"ingredient_id": food["ingredients"][0]["id"], "outcome": "EATEN"}
    ]
    assert (await api_client.put(url, headers=headers, json=first)).status_code == 200
    second = review_payload(saved, outcome="UNCLEAR", difficulty_reasons=["NOT_SURE"])
    response = await api_client.put(url, headers=headers, json=second)
    assert response.status_code == 200, response.text
    reviewed = response.json()["foods"][0]
    assert reviewed["outcome"] == "UNCLEAR" and reviewed["difficulty_reasons"] == ["NOT_SURE"]
    assert reviewed["ingredients"][0]["outcome"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "reasons",
    [
        [{"category": "texture", "subcategory": "hardness", "value": "soft"}],
        ["texture.hardness.soft"],
        ["TASTE.INTENSITY"],
        ["COLOR.RED", "COLOR.RED"],
    ],
    ids=["old-object", "lowercase", "unknown-value", "duplicate"],
)
async def test_review_rejects_invalid_difficulty_reasons(api_client: AsyncClient, reasons) -> None:
    headers = await auth_headers(api_client, "review@example.com")
    saved = await save_meal(api_client, headers)
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/review",
        headers=headers,
        json=review_payload(saved, difficulty_reasons=reasons),
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    detail = (await api_client.get(f"/api/v1/meals/{saved['id']}", headers=headers)).json()
    assert detail["foods"][0]["outcome"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize("case", ["null-outcome", "lowercase-outcome", "old-fields"])
async def test_review_rejects_malformed_results(api_client: AsyncClient, case: str) -> None:
    headers = await auth_headers(api_client, "review@example.com")
    saved = await save_meal(api_client, headers)
    payload = review_payload(saved)
    result = payload["food_results"][0]
    if case == "null-outcome":
        result["outcome"] = None
    elif case == "lowercase-outcome":
        result["outcome"] = "eaten"
    else:
        result["difficulties"] = []
    response = await api_client.put(
        f"/api/v1/meals/{saved['id']}/review", headers=headers, json=payload
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_invalid_review_preserves_previous_review(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "review-recover@example.com")
    saved = await save_meal(api_client, headers)
    other = await save_meal(api_client, headers)
    url = f"/api/v1/meals/{saved['id']}"
    written = await api_client.put(f"{url}/review", headers=headers, json=review_payload(saved))
    assert written.status_code == 200
    before = (await api_client.get(url, headers=headers)).json()
    unknown_food = review_payload(saved)
    unknown_food["food_results"][0]["food_id"] = "9999"
    foreign_food = review_payload(other)
    foreign_ingredient = review_payload(saved)
    foreign_ingredient["food_results"][0]["ingredient_outcomes"] = [
        {"ingredient_id": other["foods"][0]["ingredients"][0]["id"], "outcome": "EATEN"}
    ]
    for payload in (unknown_food, foreign_food, foreign_ingredient):
        rejected = await api_client.put(f"{url}/review", headers=headers, json=payload)
        assert rejected.status_code == 422
        assert rejected.json()["error_code"] == "INVALID_MEAL_REVIEW"
    assert (await api_client.get(url, headers=headers)).json() == before


@pytest.mark.asyncio
async def test_reviewed_meal_cannot_be_edited(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "edit@example.com")
    saved = await save_meal(api_client, headers)
    url = f"/api/v1/meals/{saved['id']}"
    assert (
        await api_client.put(f"{url}/review", headers=headers, json=review_payload(saved))
    ).status_code == 200
    rejected = await api_client.put(
        f"{url}/foods",
        headers=headers,
        json={"foods": [{**food_payload(), "id": saved["foods"][0]["id"]}]},
    )
    assert rejected.status_code == 409
    assert rejected.json()["error_code"] == "MEAL_ALREADY_REVIEWED"


@pytest.mark.asyncio
async def test_delete_meal_removes_foods_ingredients_and_tries(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "delete@example.com")
    recommendation_id = await seed_recommendation(1)
    payload = meal_payload()
    payload["foods"][0]["food_recommendation_ids"] = [str(recommendation_id)]
    saved = await save_meal(api_client, headers, payload)
    foods_before = await count_rows(MealFood)
    response = await api_client.delete(f"/api/v1/meals/{saved['id']}", headers=headers)
    assert response.status_code == 204
    assert await count_rows(MealFood) == foods_before - 1
    assert await count_rows(MealFoodIngredient) == 0
    assert await count_rows(FoodRecommendationTry) == 0
    missing = await api_client.get(f"/api/v1/meals/{saved['id']}", headers=headers)
    assert missing.status_code == 404 and missing.json()["error_code"] == "MEAL_NOT_FOUND"


@pytest.mark.asyncio
async def test_meals_are_isolated_between_users(api_client: AsyncClient) -> None:
    owner = await auth_headers(api_client, "owner@example.com")
    other = await auth_headers(api_client, "other@example.com")
    saved = await save_meal(api_client, owner)
    url = f"/api/v1/meals/{saved['id']}"
    assert (await api_client.get(url, headers=other)).status_code == 404
    assert (await api_client.delete(url, headers=other)).status_code == 404
    assert (await api_client.get("/api/v1/meals", headers=other)).json() == []
    reviewed = await api_client.put(f"{url}/review", headers=other, json=review_payload(saved))
    assert reviewed.status_code == 404
