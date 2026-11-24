# AI-generated with GPT-6, 2026-11-24, reviewed by Haechan Jung
# Changed: 고정 평가 사례용 한국어 원본 카탈로그를 테스트 DB에 준비

"""영어 전환 전 평가 사례의 재료·판정을 원본 스냅샷으로 준비한다."""

import json
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType

SNAPSHOT = Path(__file__).resolve().parents[1] / "fixtures" / "legacy_ingredient_catalog.json"


async def seed_legacy_catalog(session: AsyncSession) -> None:
    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    session.add_all(
        Ingredient(id=row["id"], korean_name=row["korean_name"]) for row in data["ingredients"]
    )
    await session.flush()
    session.add_all(
        IngredientRestriction(
            ingredient_id=row["ingredient_id"],
            restriction_type=RestrictionType(row["restriction_type"]),
            degree=RestrictionDegree(row["degree"]),
        )
        for row in data["restrictions"]
    )
    await session.flush()
