# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: JSON mock 카탈로그를 DB 에서 읽은 사용 가능 재료 집합으로 교체,
# 제한 어휘를 RestrictionType 으로 변경

"""추천에 쓸 수 있는 재료 카탈로그와 아이의 제한(알러지 · 채식 · 식이 제한).

워크플로의 검증은 DB 세션을 열지 않는다. 그래서 서비스가 아이의 제한에 맞는 재료 이름을
DB 에서 미리 읽어(`catalog.py`) `Catalog` 로 그래프에 넘기고,
이 모듈은 그 값을 읽는 순수 함수만 둔다.
프롬프트의 "쓸 수 있는 재료" 목록과 `validation.py`가 같은 카탈로그를 쓴다.
"""

from dataclasses import dataclass, field

from app.models.restriction_enums import RestrictionType


@dataclass(frozen=True)
class ChildRestrictions:
    """아이의 제한 목록 (알러지 · 채식 · 식이 제한을 합친 `RestrictionType` 의 집합)."""

    types: frozenset[RestrictionType] = frozenset()


@dataclass(frozen=True)
class Catalog:
    """이 아이가 쓸 수 있는 재료. 정규화한 이름에서 원래 이름으로 찾는다.

    목록에 없는 재료는 쓸 수 없거나 알 수 없는 재료다. 둘은 구분하지 않는다.
    """

    names: dict[str, str] = field(default_factory=dict)


def normalize_name(name: str) -> str:
    """재료 이름 비교용 정규화. 공백과 대소문자 차이를 없앤다."""
    return " ".join(name.split()).casefold()


def build_catalog(names: list[str]) -> Catalog:
    return Catalog(names={normalize_name(name): name for name in names})


def is_usable(catalog: Catalog, name: str) -> bool:
    """이름이 카탈로그의 사용 가능한 재료와 정확히 일치하는지 본다."""
    return normalize_name(name) in catalog.names


def usable_ingredient_names(catalog: Catalog, candidates: list[str]) -> list[str]:
    """후보 중 이 아이가 쓸 수 있는 재료 이름만 반환한다.

    후보가 비어 있으면 쓸 수 있는 재료 전체를 반환한다.
    """
    if not candidates:
        return sorted(catalog.names.values())
    return [name for name in candidates if is_usable(catalog, name)]
