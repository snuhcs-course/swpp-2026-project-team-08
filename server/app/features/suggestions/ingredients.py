# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""재료 카탈로그와 아이의 제한(알러지 · 식이 제한) 판정.

`search_available_ingredients` 도구와 `validation.py`가 같은 카탈로그와 규칙을 쓰도록 한곳에 모았다.
카탈로그는 `queries.load_catalog`에서 DB를 읽어 전달한다.
"""

from dataclasses import dataclass
from enum import StrEnum


class RestrictionId(StrEnum):
    """제한 id. 값은 클라이언트 프로필의 알레르기·식이 제한·식단 방식 값과 같아야 한다.

    클라이언트 id를 바꾸면 이 enum도 함께 고친다 (`docs/food-ingredient-restriction-ids.md`).
    """

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
    """카탈로그의 재료 하나. `never_restrictions`는 제한에 걸리지 않는다고 판정된 ID다."""

    names: tuple[str, ...]
    never_restrictions: frozenset[RestrictionId] = frozenset()


Catalog = dict[str, Ingredient]


def normalize_name(name: str) -> str:
    """재료 이름 비교용 정규화. 공백과 대소문자 차이를 없앤다."""
    return " ".join(name.split()).casefold()


def build_catalog(items: list[Ingredient]) -> Catalog:
    """같은 별칭이 여러 재료를 뜻하면 그 별칭은 검색에서 제외한다."""
    catalog: Catalog = {}
    ambiguous: set[str] = set()
    for item in items:
        for name in item.names:
            key = normalize_name(name)
            if key in catalog and catalog[key] is not item:
                ambiguous.add(key)
            catalog[key] = item
    return {key: item for key, item in catalog.items() if key not in ambiguous}


def find_ingredient(name: str, catalog: Catalog) -> Ingredient | None:
    """이름이 카탈로그와 정확히 일치하는 재료를 찾는다. 없으면 None."""
    return catalog.get(normalize_name(name))


def conflicting_restrictions(
    ingredient: Ingredient, restrictions: ChildRestrictions
) -> list[RestrictionId]:
    """선택한 제한에서 NEVER가 빠진 ID를 정렬해 반환한다.

    gluten-free·ketogenic도 식단 적합성이 아니라 제한에 걸리는지를 저장한다.
    모든 제한에서 NEVER만 통과하며 ALWAYS·제품별·행 없음은 차단한다.
    """
    return sorted(restrictions.ids - ingredient.never_restrictions)


def usable_ingredient_names(
    restrictions: ChildRestrictions, candidates: list[str], catalog: Catalog
) -> list[str]:
    """후보 중 이 아이가 쓸 수 있는 재료 이름만 반환한다.

    후보가 비어 있으면 카탈로그 전체에서 쓸 수 있는 재료의 대표 이름을 반환한다.
    대표 이름이 모호하면 같은 재료의 다른 이름을 사용한다.
    """
    if not candidates:
        # 대표 이름이 모호하면 확실하게 조회 가능한 다른 별칭을 사용한다.
        names = []
        for item in {id(i): i for i in catalog.values()}.values():
            if not conflicting_restrictions(item, restrictions):
                names.append(next(n for n in item.names if find_ingredient(n, catalog) is item))
        return names
    return [
        name
        for name in candidates
        if (item := find_ingredient(name, catalog)) is not None
        and not conflicting_restrictions(item, restrictions)
    ]
