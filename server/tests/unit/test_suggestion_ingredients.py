# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: DB 에서 읽은 사용 가능 재료 집합(Catalog) 기준으로 재작성
"""재료 카탈로그 조회 (`ingredients.py`) 단위 테스트. DB 없이 값만으로 확인한다."""

from app.features.suggestions.ingredients import (
    build_catalog,
    is_usable,
    normalize_name,
    usable_ingredient_names,
)

CATALOG = build_catalog(["쌀", "당근", "Peanut Butter"])


def test_normalize_name_ignores_case_and_spaces():
    assert normalize_name("  Peanut   Butter ") == "peanut butter"


def test_is_usable_matches_the_exact_name_only():
    assert is_usable(CATALOG, "peanut  butter")
    assert is_usable(CATALOG, " 쌀 ")
    assert not is_usable(CATALOG, "땅콩 소스")  # 부분 일치는 하지 않는다
    assert not is_usable(CATALOG, "쌀밥")


def test_usable_ingredient_names_filters_candidates():
    assert usable_ingredient_names(CATALOG, ["쌀", "우유", "당근"]) == ["쌀", "당근"]


def test_usable_ingredient_names_without_candidates_lists_the_whole_catalog():
    names = usable_ingredient_names(CATALOG, [])
    assert names == sorted(["쌀", "당근", "Peanut Butter"])
    assert len(names) == len(set(names))


def test_empty_catalog_has_nothing_usable():
    empty = build_catalog([])
    assert usable_ingredient_names(empty, []) == []
    assert not is_usable(empty, "쌀")
