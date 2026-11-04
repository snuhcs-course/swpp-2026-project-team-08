# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 아이가 잘 먹는 음식(safe food, 과거 EATEN 음식)을 읽는 로더 추가

"""DB 에서 아이 한 명이 잘 먹는다고 기록된 음식을 읽어 `FamiliarFoods` 로 만든다.

두 가지를 모은다.
- 프로필의 safe food: 보호자가 적은, 아이가 안정적으로 먹는 음식과 그 조리·제공 형태.
- 과거 식사에서 식후 리뷰가 `EATEN` 인 음식: 최근 것부터, 같은 이름은 한 번만.
"""

from collections.abc import Collection

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.workflow.state import (
    FamiliarEatenFood,
    FamiliarFoods,
    FamiliarSafeFood,
)
from app.models import Meal, MealFood, MealFoodIngredient, UserProfileSafeFood
from app.models.meal_enums import EatingOutcome

# 프롬프트가 커지지 않도록 읽는 개수를 제한한다.
SAFE_FOOD_LIMIT = 30
EATEN_FOOD_LIMIT = 20
# 같은 이름을 한 번만 남기기 전에 최근 순으로 읽는 행 수.
# 자주 먹은 음식이 많아도 여러 종류가 남도록 개수 제한보다 넉넉하게 읽는다.
EATEN_SCAN_LIMIT = 200


def _same_name_key(name: str) -> str:
    return " ".join(name.split()).casefold()


async def load_familiar_foods(
    session: AsyncSession, user_id: int, *, exclude_food_ids: Collection[int] = ()
) -> FamiliarFoods:
    """아이가 잘 먹는 음식을 읽는다. `exclude_food_ids` 의 음식은 뺀다 (이번에 제안할 음식 자신).

    기록이 없으면 빈 `FamiliarFoods` 이다. 제안을 익숙한 것과 이어 주는 참고 정보일 뿐이라
    없어도 제안은 만들어진다.
    """
    safe_rows = (
        await session.scalars(
            select(UserProfileSafeFood)
            .where(UserProfileSafeFood.user_id == user_id)
            .order_by(UserProfileSafeFood.id)
            .limit(SAFE_FOOD_LIMIT)
        )
    ).all()

    eaten_query = (
        select(MealFood)
        .join(Meal, MealFood.meal_id == Meal.id)
        .where(Meal.user_id == user_id, MealFood.outcome == EatingOutcome.EATEN)
    )
    if exclude_food_ids:
        eaten_query = eaten_query.where(MealFood.id.not_in(exclude_food_ids))
    eaten_rows = (
        await session.scalars(
            eaten_query.order_by(
                Meal.meal_date.desc(), Meal.saved_at.desc(), MealFood.id.desc()
            ).limit(EATEN_SCAN_LIMIT)
        )
    ).all()

    recent: list[MealFood] = []
    seen: set[str] = set()
    for food in eaten_rows:
        key = _same_name_key(food.name)
        if key in seen:
            continue
        seen.add(key)
        recent.append(food)
        if len(recent) == EATEN_FOOD_LIMIT:
            break

    ingredient_names: dict[int, list[str]] = {food.id: [] for food in recent}
    if recent:
        ingredient_rows = (
            await session.scalars(
                select(MealFoodIngredient)
                .where(MealFoodIngredient.meal_food_id.in_(ingredient_names))
                .order_by(MealFoodIngredient.id)
            )
        ).all()
        for ingredient in ingredient_rows:
            ingredient_names[ingredient.meal_food_id].append(ingredient.name)

    return FamiliarFoods(
        safe_foods=tuple(
            FamiliarSafeFood(
                name=row.name,
                preparation=row.preparation,
                presentation_note=row.presentation_note,
            )
            for row in safe_rows
        ),
        eaten_foods=tuple(
            FamiliarEatenFood(
                name=food.name,
                cooking_method=food.cooking_method.value if food.cooking_method else None,
                ingredients=tuple(ingredient_names[food.id]),
            )
            for food in recent
        ),
    )
