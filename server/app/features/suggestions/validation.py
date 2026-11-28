# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 쓸 수 있는 재료 목록과 비교하고 causes 빈 문장을 검사하도록 변경
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 추천 개수와 같은 응답·지난 추천과 겹치는 음식 이름 검사로 개편

"""생성 결과가 요청과 아이가 쓸 수 있는 재료에 맞는지 판단하는 순수 함수.

문제를 예외로 던지지 않고 목록으로 반환한다. 재시도 지시문은 `workflow/prompts.py`가 만든다.
"""

from collections.abc import Sequence

from app.features.suggestions.ingredients import Catalog, is_usable, normalize_name
from app.features.suggestions.workflow.state import (
    GeneratedSuggestion,
    PastRecommendation,
    ValidationProblem,
)

TEXT_FIELDS = ("what_to_try", "why_this_may_help", "preparation_method")


def find_problems(
    results: list[GeneratedSuggestion],
    *,
    count: int,
    history: Sequence[PastRecommendation],
    catalog: Catalog,
) -> list[ValidationProblem]:
    """요청한 개수 · 지난 추천 · 쓸 수 있는 재료와 결과를 비교해 문제 목록을 반환한다.

    음식 이름은 공백과 대소문자를 무시하고 비교한다. 문제가 없으면 빈 리스트를 반환한다.
    """
    problems: list[ValidationProblem] = []
    if len(results) != count:
        problems.append(ValidationProblem(kind="wrong_count", count=len(results)))
    past = {normalize_name(item.what_to_try) for item in history}
    seen: set[str] = set()
    for position, result in enumerate(results):
        for field in TEXT_FIELDS:
            if not getattr(result, field).strip():
                problems.append(
                    ValidationProblem(kind="blank_field", position=position, field=field)
                )
        name = normalize_name(result.what_to_try)
        if name and name in seen:
            problems.append(ValidationProblem(kind="duplicate_food", position=position))
        elif name and name in past:
            problems.append(ValidationProblem(kind="repeated_food", position=position))
        seen.add(name)
        problems.extend(_ingredient_problems(position, result, catalog))
    return problems


def _ingredient_problems(
    position: int, result: GeneratedSuggestion, catalog: Catalog
) -> list[ValidationProblem]:
    """추천 하나의 `ingredients`가 모두 쓸 수 있는 재료 목록에 있는지 본다."""
    names = [name for name in result.ingredients if name.strip()]
    if not names:
        return [ValidationProblem(kind="empty_ingredients", position=position)]
    return [
        ValidationProblem(kind="unavailable_ingredient", position=position, ingredient=name)
        for name in names
        if not is_usable(catalog, name)
    ]
