# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
"""제안 생성에 쓰는 아이의 정보 조회.

프로필의 알러지 · 식이 제한과 선호, 잘 먹는 음식(`SafeFood`), 지난 식사에서 손도 대지 않은
음식 · 재료를 읽어 평범한 값(dataclass)으로 돌려준다. 온보딩 기능의 서비스를 부르지 않고
모델을 직접 조회한다.
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.workflow.state import ChildContext, SafeFoodInfo
from app.models import (
    Meal,
    ReviewFoodResult,
    ReviewIngredientResult,
    SafeFood,
    UserProfile,
    UserProfileChoice,
)

# 손도 대지 않은 음식 · 재료를 최근 기록부터 최대 몇 개까지 읽는가.
MAX_REFUSED = 10


@dataclass(frozen=True)
class ChildData:
    """`restrictions`는 코드로 검증하는 제한이고, `context`는 프롬프트에 싣는 정보다."""

    restrictions: ChildRestrictions
    context: ChildContext


def _choice_value(choice: UserProfileChoice) -> str:
    """선택 항목의 표시 값. 고른 옵션이면 code, 직접 입력했으면 custom_name이다."""
    return choice.code if choice.code is not None else str(choice.custom_name)


def _split_restrictions(
    choices: list[UserProfileChoice],
) -> tuple[frozenset[RestrictionId], tuple[str, ...]]:
    """알러지 · 식이 제한 선택을 `RestrictionId` 집합과 그 밖의 이름으로 나눈다."""
    ids: set[RestrictionId] = set()
    others: list[str] = []
    for choice in choices:
        try:
            ids.add(RestrictionId(_choice_value(choice)))
        except ValueError:
            others.append(_choice_value(choice))
    return frozenset(ids), tuple(others)


async def _refused_names(session: AsyncSession, user_id: int) -> tuple[list[str], list[str]]:
    """지난 식사에서 `untouched`였던 음식 이름과 재료 이름을 최근 기록부터 반환한다."""
    foods = await session.scalars(
        select(ReviewFoodResult)
        .join(Meal, Meal.id == ReviewFoodResult.meal_id)
        .where(Meal.user_id == user_id, ReviewFoodResult.outcome == "untouched")
        .order_by(Meal.meal_date.desc(), Meal.id.desc(), ReviewFoodResult.food_id)
        .limit(MAX_REFUSED)
    )
    food_names = [row.food_snapshot["name"] for row in foods]

    rows = await session.execute(
        select(ReviewIngredientResult.ingredient_id, ReviewFoodResult.food_snapshot)
        .join(
            ReviewFoodResult,
            (ReviewFoodResult.meal_id == ReviewIngredientResult.meal_id)
            & (ReviewFoodResult.food_id == ReviewIngredientResult.food_id),
        )
        .join(Meal, Meal.id == ReviewIngredientResult.meal_id)
        .where(Meal.user_id == user_id, ReviewIngredientResult.outcome == "untouched")
        .order_by(
            Meal.meal_date.desc(),
            Meal.id.desc(),
            ReviewIngredientResult.food_id,
            ReviewIngredientResult.ingredient_id,
        )
        .limit(MAX_REFUSED)
    )
    ingredient_names = []
    for ingredient_id, snapshot in rows:
        for item in snapshot["ingredients"]:
            if int(item["id"]) == ingredient_id:
                ingredient_names.append(item["name"])
    # 같은 이름이 여러 번 나와도 한 번만 싣는다 (처음 나온 순서 유지).
    return list(dict.fromkeys(food_names)), list(dict.fromkeys(ingredient_names))


async def load_child_data(session: AsyncSession, user_id: int) -> ChildData:
    """사용자의 아이 정보를 모은다. 프로필이 없으면 빈 값으로 채운다."""
    profile = await session.get(UserProfile, user_id)
    choices = list(
        (
            await session.scalars(
                select(UserProfileChoice)
                .where(UserProfileChoice.user_id == user_id)
                .order_by(UserProfileChoice.category, UserProfileChoice.position)
            )
        ).all()
    )
    safe_foods = (
        await session.scalars(
            select(SafeFood).where(SafeFood.user_id == user_id).order_by(SafeFood.position)
        )
    ).all()
    refused_foods, refused_ingredients = await _refused_names(session, user_id)

    def values(category: str) -> list[UserProfileChoice]:
        return [choice for choice in choices if choice.category == category]

    restriction_ids, other_restrictions = _split_restrictions(
        values("allergy") + values("restriction")
    )
    context = ChildContext(
        age_group=profile.age_group if profile else None,
        smell_sensitivity=profile.smell_sensitivity if profile else None,
        preferred_temperature=profile.preferred_temperature if profile else None,
        new_food_response=profile.new_food_response if profile else None,
        difficult_textures=tuple(_choice_value(c) for c in values("difficult_texture")),
        difficult_tastes=tuple(_choice_value(c) for c in values("difficult_taste")),
        presentation_preferences=tuple(_choice_value(c) for c in values("presentation_preference")),
        other_restrictions=other_restrictions,
        safe_foods=tuple(
            SafeFoodInfo(
                name=food.name,
                preparation=food.preparation,
                presentation_note=food.presentation_note,
            )
            for food in safe_foods
        ),
        refused_foods=tuple(refused_foods),
        refused_ingredients=tuple(refused_ingredients),
    )
    return ChildData(restrictions=ChildRestrictions(ids=restriction_ids), context=context)
