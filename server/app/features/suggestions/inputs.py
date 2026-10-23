# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
"""선택한 target과 식사 리뷰 기록으로 워크플로 입력(`FoodInput`)을 만든다."""

from app.features.suggestions.workflow.state import Difficulty, FoodInput
from app.models import ReviewFoodResult, ReviewIngredientResult


def _difficulties(raw: list[dict]) -> tuple[Difficulty, ...]:
    return tuple(
        Difficulty(
            category=item["category"],
            subcategory=item.get("subcategory"),
            value=item["value"],
        )
        for item in raw
    )


def build_food_inputs(
    targets: list[tuple[int, int | None]],
    food_results: dict[int, ReviewFoodResult],
    ingredient_results: list[ReviewIngredientResult],
) -> list[FoodInput]:
    """target마다 `FoodInput`을 만든다. `targets`는 (food_id, ingredient_id) 쌍의 목록이다.

    `FoodInput.id`는 DB id가 아니라 target 목록의 순번(`"0"`, `"1"`...)이다. 같은 음식이
    음식 전체와 그 안의 재료로 함께 요청될 수 있어서 항상 유일한 값을 쓴다.
    """
    by_ingredient = {(row.food_id, row.ingredient_id): row for row in ingredient_results}
    inputs: list[FoodInput] = []
    for index, (food_id, ingredient_id) in enumerate(targets):
        result = food_results[food_id]
        snapshot = result.food_snapshot
        if ingredient_id is None:
            inputs.append(
                FoodInput(
                    id=str(index),
                    name=snapshot["name"],
                    ingredients=tuple(item["name"] for item in snapshot["ingredients"]),
                    cooking_method=snapshot.get("cooking_method"),
                    serving_note=snapshot.get("serving_note"),
                    outcome=result.outcome,
                    difficulties=_difficulties(result.difficulties),
                )
            )
            continue
        ingredient_result = by_ingredient[(food_id, ingredient_id)]
        name = next(
            item["name"] for item in snapshot["ingredients"] if int(item["id"]) == ingredient_id
        )
        inputs.append(
            FoodInput(
                id=str(index),
                name=name,
                outcome=ingredient_result.outcome,
                difficulties=_difficulties(ingredient_result.difficulties),
                parent_food=snapshot["name"],
            )
        )
    return inputs
