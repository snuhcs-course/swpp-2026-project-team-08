# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
"""제안 입력 만들기(`inputs.py`)와 아이 정보 조회(`queries.py`) 테스트. 인메모리 SQLite를 쓴다."""

from collections.abc import AsyncGenerator
from datetime import date

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.database import Base
from app.core.timezone import now_kst
from app.features.suggestions.ingredients import RestrictionId
from app.features.suggestions.inputs import build_food_inputs
from app.features.suggestions.queries import MAX_REFUSED, load_child_data
from app.features.suggestions.workflow.state import Difficulty
from app.models import (
    Meal,
    ReviewFoodResult,
    ReviewIngredientResult,
    SafeFood,
    User,
    UserProfile,
    UserProfileChoice,
)


@pytest_asyncio.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as db:
        yield db
    await engine.dispose()


def snapshot(name: str, ingredients: dict[str, str] | None = None) -> dict:
    return {
        "name": name,
        "ingredients": [{"id": key, "name": value} for key, value in (ingredients or {}).items()],
        "cooking_method": "boiled",
        "serving_note": "작게 썰기",
        "acceptance": None,
    }


async def add_user(db: AsyncSession, email: str) -> int:
    user = User(email=email, hashed_password="x", full_name="보호자")
    db.add(user)
    await db.flush()
    return user.id


async def add_meal(db: AsyncSession, user_id: int, meal_date: date) -> int:
    meal = Meal(
        user_id=user_id,
        meal_date=meal_date,
        meal_type="lunch",
        setting="home",
        saved_at=now_kst(),
    )
    db.add(meal)
    await db.flush()
    return meal.id


async def test_load_child_data_collects_profile_and_history(session: AsyncSession):
    user_id = await add_user(session, "a@example.com")
    other_id = await add_user(session, "b@example.com")
    session.add(
        UserProfile(
            user_id=user_id,
            child_name="아이",
            age_group="4-5",
            allergy_status="specified",
            restriction_status="specified",
            smell_sensitivity="sometimes",
            preferred_temperature="warm",
            new_food_response="tastes",
            safe_food_status="listed",
        )
    )
    await session.flush()
    session.add_all(
        [
            UserProfileChoice(user_id=user_id, category="allergy", position=0, code="peanut"),
            UserProfileChoice(
                user_id=user_id, category="allergy", position=1, custom_name="복숭아"
            ),
            UserProfileChoice(user_id=user_id, category="restriction", position=0, code="no-pork"),
            UserProfileChoice(
                user_id=user_id, category="difficult_texture", position=0, code="slimy"
            ),
            UserProfileChoice(
                user_id=user_id, category="difficult_taste", position=0, code="bitter"
            ),
            SafeFood(user_id=user_id, position=1, name="김밥", preparation="작게 썰어서"),
            SafeFood(
                user_id=user_id,
                position=0,
                name="흰쌀밥",
                preparation="따뜻하게",
                presentation_note="따로 담기",
            ),
        ]
    )
    old_meal = await add_meal(session, user_id, date(2026, 10, 1))
    new_meal = await add_meal(session, user_id, date(2026, 10, 2))
    other_meal = await add_meal(session, other_id, date(2026, 10, 3))
    session.add_all(
        [
            ReviewFoodResult(
                meal_id=old_meal,
                food_id=1,
                food_snapshot=snapshot("시금치국", {"7": "시금치"}),
                outcome="untouched",
            ),
            ReviewFoodResult(
                meal_id=new_meal,
                food_id=2,
                food_snapshot=snapshot("버섯볶음", {"8": "버섯", "9": "당근"}),
                outcome="untouched",
            ),
            ReviewFoodResult(
                meal_id=new_meal, food_id=3, food_snapshot=snapshot("계란찜"), outcome="eaten"
            ),
            ReviewFoodResult(
                meal_id=other_meal,
                food_id=4,
                food_snapshot=snapshot("남의 음식"),
                outcome="untouched",
            ),
        ]
    )
    await session.flush()
    session.add_all(
        [
            ReviewIngredientResult(
                meal_id=new_meal, food_id=2, ingredient_id=8, outcome="untouched"
            ),
            ReviewIngredientResult(meal_id=new_meal, food_id=2, ingredient_id=9, outcome="eaten"),
        ]
    )
    await session.flush()

    data = await load_child_data(session, user_id)

    # 코드로 판정할 수 있는 제한만 집합에 들어가고, 직접 입력한 이름은 프롬프트용으로 남는다.
    assert data.restrictions.ids == {RestrictionId.PEANUT, RestrictionId.NO_PORK}
    assert data.context.other_restrictions == ("복숭아",)
    assert data.context.age_group == "4-5"
    assert data.context.preferred_temperature == "warm"
    assert data.context.difficult_textures == ("slimy",)
    assert data.context.difficult_tastes == ("bitter",)
    assert [f.name for f in data.context.safe_foods] == ["흰쌀밥", "김밥"]
    assert data.context.safe_foods[0].presentation_note == "따로 담기"
    # 최근 식사부터, 내 기록만, untouched만.
    assert data.context.refused_foods == ("버섯볶음", "시금치국")
    assert data.context.refused_ingredients == ("버섯",)


async def test_load_child_data_without_profile_is_empty(session: AsyncSession):
    user_id = await add_user(session, "c@example.com")

    data = await load_child_data(session, user_id)

    assert data.restrictions.ids == frozenset()
    assert data.context.safe_foods == ()
    assert data.context.age_group is None


async def test_refused_names_are_limited(session: AsyncSession):
    user_id = await add_user(session, "d@example.com")
    for day in range(1, MAX_REFUSED + 4):
        meal_id = await add_meal(session, user_id, date(2026, 9, day))
        session.add(
            ReviewFoodResult(
                meal_id=meal_id,
                food_id=1,
                food_snapshot=snapshot(f"음식{day}"),
                outcome="untouched",
            )
        )
    await session.flush()

    data = await load_child_data(session, user_id)

    assert len(data.context.refused_foods) == MAX_REFUSED
    assert data.context.refused_foods[0] == f"음식{MAX_REFUSED + 3}"


async def test_build_food_inputs_for_food_and_ingredient_targets(session: AsyncSession):
    user_id = await add_user(session, "e@example.com")
    meal_id = await add_meal(session, user_id, date(2026, 10, 1))
    food_result = ReviewFoodResult(
        meal_id=meal_id,
        food_id=1,
        food_snapshot=snapshot("당근 감자볶음", {"182": "당근", "212": "감자"}),
        outcome="tasted",
        difficulties=[{"category": "texture", "subcategory": "hardness", "value": "hard"}],
    )
    ingredient_result = ReviewIngredientResult(
        meal_id=meal_id,
        food_id=1,
        ingredient_id=182,
        outcome="untouched",
        difficulties=[{"category": "smell", "value": "strong"}],
    )

    inputs = build_food_inputs([(1, None), (1, 182)], {1: food_result}, [ingredient_result])

    food, ingredient = inputs
    assert (food.id, food.name, food.ingredients) == ("0", "당근 감자볶음", ("당근", "감자"))
    assert (food.cooking_method, food.serving_note, food.outcome) == (
        "boiled",
        "작게 썰기",
        "tasted",
    )
    assert food.difficulties == (Difficulty("texture", "hardness", "hard"),)
    assert food.parent_food is None
    assert (ingredient.id, ingredient.name, ingredient.parent_food) == (
        "1",
        "당근",
        "당근 감자볶음",
    )
    assert ingredient.outcome == "untouched"
    assert ingredient.difficulties == (Difficulty("smell", None, "strong"),)
