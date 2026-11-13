# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 아이가 쓸 수 있는 재료를 쿼리 한 번으로 읽는 카탈로그 로더 추가
# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 영어 우선 조회와 전환 전 한국어 목록 호환

"""DB 의 재료와 제한 판정에서 아이 한 명이 쓸 수 있는 `Catalog` 를 만든다."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.ingredients import Catalog, ChildRestrictions, build_catalog
from app.models import Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree


async def load_catalog(session: AsyncSession, restrictions: ChildRestrictions) -> Catalog:
    """아이의 제한마다 `NEVER` 판정이 있는 재료의 이름만 모은다. 쿼리는 한 번이다.

    판정 행이 없으면 미판정 또는 검토 보류이므로 그 제한을 가진 아이에게는 쓸 수 없다.
    `DEPENDS_ON_PRODUCT` 와 `ALWAYS` 도 쓸 수 없다.
    영어 이름을 우선하며 영어 데이터 적재 전에는 기존 한국어 이름을 사용한다.
    (재료, 제한) 쌍은 유니크하다. `NEVER` 행 수가 아이의 제한 수와 같으면 조회 조건을 충족한다.
    """
    name = func.coalesce(
        func.nullif(func.trim(Ingredient.english_name), ""),
        func.nullif(func.trim(Ingredient.korean_name), ""),
    )
    query = select(name).where(name.is_not(None))
    if restrictions.types:
        safe_count = (
            select(func.count())
            .where(
                IngredientRestriction.ingredient_id == Ingredient.id,
                IngredientRestriction.restriction_type.in_(restrictions.types),
                IngredientRestriction.degree == RestrictionDegree.NEVER,
            )
            .scalar_subquery()
        )
        query = query.where(safe_count == len(restrictions.types))
    return build_catalog(list((await session.scalars(query)).all()))
