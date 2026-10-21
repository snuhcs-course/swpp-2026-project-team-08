# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""재료 카탈로그 조회와 제한 판정 (`ingredients.py`) 단위 테스트."""

import json

import pytest

from app.features.suggestions import ingredients
from app.features.suggestions.ingredients import (
    ChildRestrictions,
    RestrictionId,
    conflicting_restrictions,
    find_ingredient,
    normalize_name,
    usable_ingredient_names,
)


def restrictions(*ids: str) -> ChildRestrictions:
    return ChildRestrictions(ids=frozenset(RestrictionId(i) for i in ids))


def test_restriction_ids_match_client_profile_ids():
    assert len(RestrictionId) == 20
    assert RestrictionId("tree-nut") is RestrictionId.TREE_NUT


def test_unknown_restriction_id_in_catalog_fails_to_load(tmp_path, monkeypatch):
    path = tmp_path / "catalog.json"
    path.write_text(
        json.dumps({"ingredients": [{"names": ["x"], "restrictions": ["pnut"]}]}),
        encoding="utf-8",
    )
    monkeypatch.setattr(ingredients, "CATALOG_PATH", path)
    ingredients.load_catalog.cache_clear()
    try:
        with pytest.raises(ValueError):
            ingredients.load_catalog()
    finally:
        ingredients.load_catalog.cache_clear()


def test_normalize_name_ignores_case_and_spaces():
    assert normalize_name("  Peanut   Butter ") == "peanut butter"


def test_find_ingredient_matches_every_name_exactly():
    assert find_ingredient("Peanut Butter") is find_ingredient("땅콩버터")
    assert find_ingredient("땅콩 소스") is None  # 부분 일치는 하지 않는다


def test_conflicting_restrictions_returns_overlap_sorted():
    milk = find_ingredient("milk")
    assert conflicting_restrictions(milk, restrictions("casein-free", "milk", "egg")) == [
        "casein-free",
        "milk",
    ]
    assert conflicting_restrictions(milk, restrictions("egg")) == []


def test_usable_ingredient_names_filters_candidates():
    result = usable_ingredient_names(restrictions("peanut"), ["땅콩버터", "carrot", "unknown"])
    assert result == ["carrot"]  # 제한 재료와 카탈로그에 없는 재료는 빠진다


def test_usable_ingredient_names_without_candidates_lists_catalog():
    names = usable_ingredient_names(restrictions("milk"), [])
    assert "rice" in names
    assert "milk" not in names and "cheese" not in names
    assert len(names) == len(set(names))
