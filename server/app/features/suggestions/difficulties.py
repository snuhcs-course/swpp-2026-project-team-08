# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 아이가 잘 먹지 못한 음식과 보호자가 추정한 이유(편식 가설)를 읽는 로더 추가

"""DB 에서 아이 한 명이 최근 잘 먹지 못한 음식을 읽어 `DifficultFood` 로 만든다.

식후 리뷰의 결과가 있고 `EATEN` 이 아닌 음식을 최근 것부터 읽으며, 같은 이름은 한 번만 남긴다.
보호자가 기록한 어려움 이유는 아이의 편식 성향에 대한 가설로 프롬프트에 전달된다.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.ingredients import normalize_name
from app.features.suggestions.workflow.state import DifficultFood, IngredientResult
from app.models import Meal, MealFood, MealFoodIngredient
from app.models.meal_enums import EatingOutcome

# 프롬프트가 커지지 않도록 읽는 개수를 제한한다.
DIFFICULT_FOOD_LIMIT = 20
# 같은 이름을 한 번만 남기기 전에 최근 순으로 읽는 행 수.
DIFFICULT_SCAN_LIMIT = 200


async def load_difficult_foods(session: AsyncSession, user_id: int) -> tuple[DifficultFood, ...]:
    """아이가 최근 잘 먹지 못한 음식을 최근 것부터 읽는다. 기록이 없으면 빈 튜플이다."""
    rows = (
        await session.scalars(
            select(MealFood)
            .join(Meal, MealFood.meal_id == Meal.id)
            .where(
                Meal.user_id == user_id,
                MealFood.outcome.is_not(None),
                MealFood.outcome != EatingOutcome.EATEN,
            )
            .order_by(Meal.meal_date.desc(), Meal.saved_at.desc(), MealFood.id.desc())
            .limit(DIFFICULT_SCAN_LIMIT)
        )
    ).all()

    recent: list[MealFood] = []
    seen: set[str] = set()
    for food in rows:
        key = normalize_name(food.name)
        if key in seen:
            continue
        seen.add(key)
        recent.append(food)
        if len(recent) == DIFFICULT_FOOD_LIMIT:
            break

    ingredients: dict[int, list[MealFoodIngredient]] = {food.id: [] for food in recent}
    if recent:
        ingredient_rows = (
            await session.scalars(
                select(MealFoodIngredient)
                .where(MealFoodIngredient.meal_food_id.in_(ingredients))
                .order_by(MealFoodIngredient.id)
            )
        ).all()
        for ingredient in ingredient_rows:
            ingredients[ingredient.meal_food_id].append(ingredient)

    return tuple(
        DifficultFood(
            name=food.name,
            outcome=food.outcome.value,
            ingredients=tuple(item.name for item in ingredients[food.id]),
            cooking_method=food.cooking_method.value if food.cooking_method else None,
            difficulty_reasons=tuple(food.difficulty_reasons),
            # 보호자가 따로 리뷰한 재료만 담는다. outcome 이 NULL 이면 리뷰하지 않은 재료다.
            ingredient_results=tuple(
                IngredientResult(
                    name=item.name,
                    outcome=item.outcome.value,
                    difficulty_reasons=tuple(item.difficulty_reasons),
                )
                for item in ingredients[food.id]
                if item.outcome is not None
            ),
        )
        for food in recent
    )
