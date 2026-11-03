# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 쓸 수 있는 재료 목록과 비교하고 causes 빈 문장을 검사하도록 변경

"""생성 결과가 요청과 아이가 쓸 수 있는 재료에 맞는지 판단하는 순수 함수.

문제를 예외로 던지지 않고 목록으로 반환한다. 재시도 지시문은 `workflow/prompts.py`가 만든다.
"""

from collections import Counter

from app.features.suggestions.ingredients import Catalog, is_usable
from app.features.suggestions.workflow.state import (
    FoodInput,
    GeneratedSuggestion,
    ValidationProblem,
)

TEXT_FIELDS = ("what_to_try", "why_this_may_help", "serving_tip", "causes")


def find_problems(
    foods: list[FoodInput],
    results: list[GeneratedSuggestion],
    catalog: Catalog,
) -> list[ValidationProblem]:
    """요청한 음식 · 쓸 수 있는 재료와 결과를 비교해 문제 목록을 반환한다.

    문제가 없으면 빈 리스트를 반환한다.
    """
    problems: list[ValidationProblem] = []
    requested = {food.id for food in foods}
    counts = Counter(result.food_id for result in results)
    for food in foods:
        if food.id not in counts:
            problems.append(ValidationProblem(kind="missing_food", food_id=food.id))
    for food_id, count in counts.items():
        if food_id not in requested:
            problems.append(ValidationProblem(kind="unexpected_food", food_id=food_id))
        elif count > 1:
            problems.append(ValidationProblem(kind="duplicate_food", food_id=food_id))
    for result in results:
        for field in TEXT_FIELDS:
            if not getattr(result, field).strip():
                problems.append(
                    ValidationProblem(kind="blank_field", food_id=result.food_id, field=field)
                )
        problems.extend(_ingredient_problems(result, catalog))
    return problems


def _ingredient_problems(result: GeneratedSuggestion, catalog: Catalog) -> list[ValidationProblem]:
    """제안 하나의 `ingredients`가 모두 쓸 수 있는 재료 목록에 있는지 본다."""
    names = [name for name in result.ingredients if name.strip()]
    if not names:
        return [ValidationProblem(kind="empty_ingredients", food_id=result.food_id)]
    return [
        ValidationProblem(kind="unavailable_ingredient", food_id=result.food_id, ingredient=name)
        for name in names
        if not is_usable(catalog, name)
    ]
