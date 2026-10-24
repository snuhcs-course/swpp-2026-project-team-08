# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""재료 카탈로그 조회와 제한 판정 (`ingredients.py`) 단위 테스트."""

import json
import re
from pathlib import Path

import pytest

from app.features.suggestions.ingredients import (
    ChildRestrictions,
    RestrictionId,
    conflicting_restrictions,
    find_ingredient,
    normalize_name,
    usable_ingredient_names,
)
from tests.suggestion_catalog import CATALOG


def restrictions(*ids: str) -> ChildRestrictions:
    return ChildRestrictions(ids=frozenset(RestrictionId(i) for i in ids))


def test_restriction_ids_match_client_profile_ids():
    root = Path(__file__).resolve().parents[2]
    client = (root / "client/src/util/strings.ts").read_text()
    expected = {}
    for group, kind in (
        ("allergies", "ALLERGY"),
        ("restrictions", "DIET"),
        ("approaches", "APPROACH"),
    ):
        block = re.search(r"^  " + group + r": \[(.*?)\n  \]\.map", client, re.M | re.S)
        assert block is not None
        for rid, _en, ko in re.findall(r"\['([^']+)', '([^']+)', '([^']+)'\]", block[1]):
            expected.setdefault(rid, {"id": rid, "name": ko, "type": kind})
    assert set(expected) == set(RestrictionId)
    dataset = json.loads((root / "data/ingredient_db/restrictions.json").read_text())
    assert dataset["restrictions"] == list(expected.values())
    assert RestrictionId("tree-nut") is RestrictionId.TREE_NUT


def test_normalize_name_ignores_case_and_spaces():
    assert normalize_name("  Peanut   Butter ") == "peanut butter"


def test_find_ingredient_matches_every_name_exactly():
    assert find_ingredient("Peanut Butter", CATALOG) is find_ingredient("땅콩버터", CATALOG)
    assert find_ingredient("땅콩 소스", CATALOG) is None  # 부분 일치는 하지 않는다


def test_conflicting_restrictions_returns_overlap_sorted():
    milk = find_ingredient("milk", CATALOG)
    assert conflicting_restrictions(milk, restrictions("casein-free", "milk", "egg")) == [
        "casein-free",
        "milk",
    ]
    assert conflicting_restrictions(milk, restrictions("egg")) == []


def test_usable_ingredient_names_filters_candidates():
    result = usable_ingredient_names(
        restrictions("peanut"), ["땅콩버터", "carrot", "unknown"], CATALOG
    )
    assert result == ["carrot"]  # 제한 재료와 카탈로그에 없는 재료는 빠진다


def test_usable_ingredient_names_without_candidates_lists_catalog():
    names = usable_ingredient_names(restrictions("milk"), [], CATALOG)
    assert "rice" in names
    assert "milk" not in names and "cheese" not in names
    assert len(names) == len(set(names))


def test_search_catalog_values_are_not_fixed_restrictions():
    for term in ("lupin", "lupin-flour", "lupin-seed", "mediterranean"):
        with pytest.raises(ValueError):
            RestrictionId(term)
