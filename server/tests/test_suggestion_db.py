# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""실제 SQL 조회부터 도구·최종 검증까지 누락 판정이 허용되지 않는지 검사한다."""

import pytest
from sqlalchemy import event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base
from app.features.suggestions.ingredients import (
    ChildRestrictions,
    RestrictionId,
    build_catalog,
    usable_ingredient_names,
)
from app.features.suggestions.ingredients import Ingredient as CatalogIngredient
from app.features.suggestions.queries import load_catalog
from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from app.features.suggestions.workflow.tools import search_available_ingredients
from app.models import (
    Ingredient,
    IngredientRestriction,
    Restriction,
)


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        yield session
    await engine.dispose()


async def seed(session):
    session.add_all([Restriction(id=r, name=r, type="ALLERGY") for r in ("milk", "peanut")])
    session.add_all(
        [Ingredient(id=i, name=f"재료{i}", eng_name=f"Ingredient {i}") for i in range(1, 5)]
    )
    await session.flush()
    session.add_all(
        [
            IngredientRestriction(ingredient_id=i, restriction_id="milk", relation=r)
            for i, r in ((1, "NEVER"), (2, "ALWAYS"), (3, "DEPENDS_ON_PRODUCT"))
        ]
    )
    session.add(IngredientRestriction(ingredient_id=1, restriction_id="peanut", relation="NEVER"))
    await session.flush()


async def test_only_explicit_never_passes_search_and_validation(session):
    await seed(session)
    catalog = await load_catalog(session)
    restrictions = ChildRestrictions(frozenset({RestrictionId.MILK}))
    names = ["재료1", "재료2", "재료3", "재료4", "없는 재료"]
    assert usable_ingredient_names(restrictions, names, catalog) == ["재료1"]
    assert usable_ingredient_names(restrictions, [], catalog) == ["재료1"]
    assert search_available_ingredients.invoke(
        dict(candidates=names, restrictions=restrictions, catalog=catalog)
    ) == ["재료1"]
    for i, name in enumerate(names):
        result = GeneratedSuggestion("1", "try", "why", "tip", (name,))
        problems = find_problems([FoodInput("1", "food")], [result], restrictions, catalog)
        assert bool(problems) == (i != 0)
    assert usable_ingredient_names(restrictions, ["INGREDIENT 1"], catalog) == ["INGREDIENT 1"]
    # 선택한 모든 제한에 NEVER가 있어야 한다.
    both = ChildRestrictions(frozenset({RestrictionId.MILK, RestrictionId.PEANUT}))
    assert usable_ingredient_names(both, names, catalog) == ["재료1"]
    missing = ChildRestrictions(frozenset({RestrictionId.MILK, RestrictionId.EGG}))
    assert usable_ingredient_names(missing, names, catalog) == []


async def test_empty_db_never_falls_back(session):
    assert await load_catalog(session) == {}
    await seed(session)
    catalog = await load_catalog(session)
    # 선택한 제한이 없을 때는 DB에 등록된 모든 재료가 후보가 된다.
    assert len(usable_ingredient_names(ChildRestrictions(), [], catalog)) == 4


@pytest.mark.parametrize("relation", [None, "UNKNOWN", "never"])
async def test_invalid_relation_cannot_be_stored(session, relation):
    await seed(session)
    session.add(IngredientRestriction(ingredient_id=4, restriction_id="milk", relation=relation))
    with pytest.raises(IntegrityError):
        await session.flush()


async def test_pair_is_unique_and_foreign_keys_are_enforced(session):
    await seed(session)
    for ingredient_id, restriction_id in ((1, "milk"), (999, "milk"), (4, "missing")):
        with pytest.raises(IntegrityError):
            async with session.begin_nested():
                session.add(
                    IngredientRestriction(
                        ingredient_id=ingredient_id, restriction_id=restriction_id, relation="NEVER"
                    )
                )
                await session.flush()


def test_ambiguous_english_alias_is_not_allowed():
    a = CatalogIngredient(("재료A", "shared"), frozenset({RestrictionId.MILK}))
    b = CatalogIngredient(("재료B", "shared"))
    catalog = build_catalog([a, b])
    assert "shared" not in catalog
    assert usable_ingredient_names(
        ChildRestrictions(frozenset({RestrictionId.MILK})), ["shared", "재료A", "재료B"], catalog
    ) == ["재료A"]


def test_llm_cannot_supply_catalog_or_restrictions():
    assert set(search_available_ingredients.tool_call_schema.model_fields) == {"candidates"}
