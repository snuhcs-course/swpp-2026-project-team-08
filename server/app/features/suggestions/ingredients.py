# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""재료 카탈로그와 아이의 제한(알러지 · 식이 제한) 판정.

`search_available_ingredients` 도구와 `validation.py`가 같은 카탈로그와 규칙을 쓰도록 한곳에 모았다.
지금 카탈로그는 `mock_ingredients.json`이며, 실제 출처로 바꿀 때는 `load_catalog`만 교체한다.
"""

import json
from dataclasses import dataclass
from enum import StrEnum
from functools import lru_cache
from pathlib import Path

CATALOG_PATH = Path(__file__).parent / "mock_ingredients.json"


class RestrictionId(StrEnum):
    """제한 id. 값은 클라이언트 프로필의 알레르기·식이 제한·식단 방식 값과 같아야 한다.

    클라이언트 id를 바꾸면 이 enum도 함께 고친다 (`docs/food-ingredient-restriction-ids.md`).
    """

    # AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
    # ChoiceStepView 기본 선택 버튼만 고정 ID로 등록한다. Catalog는 재료/기타 검색이다.
    PEANUT = "peanut"
    TREE_NUT = "tree-nut"
    MILK = "milk"
    EGG = "egg"
    SOY = "soy"
    WHEAT = "wheat"
    FISH = "fish"
    SHELLFISH = "shellfish"
    SESAME = "sesame"
    GLUTEN_FREE = "gluten-free"
    LACTOSE_FREE = "lactose-free"
    CASEIN_FREE = "casein-free"
    GLUTEN_CASEIN_FREE = "gluten-casein-free"
    NO_ADDED_SUGAR = "no-added-sugar"
    LOW_FRUCTOSE = "low-fructose"
    LOW_SODIUM = "low-sodium"
    KETOGENIC = "ketogenic"


@dataclass(frozen=True)
class ChildRestrictions:
    """아이의 제한 목록 (알러지와 식이 제한을 합친 제한 id의 집합)."""

    ids: frozenset[RestrictionId] = frozenset()


@dataclass(frozen=True)
class Ingredient:
    """카탈로그의 재료 하나. `restrictions`는 이 재료가 걸리는 제한 id다."""

    names: tuple[str, ...]
    restrictions: frozenset[RestrictionId]


def normalize_name(name: str) -> str:
    """재료 이름 비교용 정규화. 공백과 대소문자 차이를 없앤다."""
    return " ".join(name.split()).casefold()


@lru_cache
def load_catalog() -> dict[str, Ingredient]:
    """정규화한 재료 이름 → 재료. 한 재료의 모든 이름이 같은 항목을 가리킨다."""
    raw = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog: dict[str, Ingredient] = {}
    for item in raw["ingredients"]:
        # 알 수 없는 제한 id는 RestrictionId에서 ValueError가 나 로드 시점에 드러난다.
        ingredient = Ingredient(
            names=tuple(item["names"]),
            restrictions=frozenset(RestrictionId(rid) for rid in item["restrictions"]),
        )
        for name in ingredient.names:
            catalog[normalize_name(name)] = ingredient
    return catalog


def find_ingredient(name: str) -> Ingredient | None:
    """이름이 카탈로그와 정확히 일치하는 재료를 찾는다. 없으면 None."""
    return load_catalog().get(normalize_name(name))


def conflicting_restrictions(
    ingredient: Ingredient, restrictions: ChildRestrictions
) -> list[RestrictionId]:
    """재료가 걸리는 제한 중 이 아이의 제한과 겹치는 id를 정렬해서 반환한다."""
    return sorted(ingredient.restrictions & restrictions.ids)


def usable_ingredient_names(restrictions: ChildRestrictions, candidates: list[str]) -> list[str]:
    """후보 중 이 아이가 쓸 수 있는 재료 이름만 반환한다.

    후보가 비어 있으면 카탈로그 전체에서 쓸 수 있는 재료의 대표 이름(첫 번째 이름)을 반환한다.
    """
    if not candidates:
        unique = {id(i): i for i in load_catalog().values()}.values()
        return [i.names[0] for i in unique if not conflicting_restrictions(i, restrictions)]
    usable = []
    for name in candidates:
        ingredient = find_ingredient(name)
        if ingredient is not None and not conflicting_restrictions(ingredient, restrictions):
            usable.append(name)
    return usable
