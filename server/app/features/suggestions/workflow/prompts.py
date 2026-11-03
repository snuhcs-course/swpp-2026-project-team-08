# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 대신 쓸 수 있는 재료 목록을 프롬프트에 담고 조리법·원인 지시 추가

"""워크플로가 LLM에 보내는 프롬프트 모음.

검증 문제(`ValidationProblem`)는 문구 없이 데이터만 갖고 있으므로, 재시도 지시문은 여기서 만든다.
"""

from app.features.suggestions.ingredients import Catalog
from app.features.suggestions.workflow.state import FoodInput, ValidationProblem

SYSTEM_PROMPT = """당신은 편식하는 아이를 둔 부모를 돕는 식사 도우미입니다.
부모가 고른 음식마다, 다음 식사에서 아이와 시도해 볼 작은 한 걸음을 제안합니다.

규칙:
- 제안에 쓰는 재료는 사용자 메시지의 "쓸 수 있는 재료" 목록에 있는 이름만, 적힌 그대로 씁니다.
  목록에 없는 재료는 이 아이가 쓸 수 없거나 알 수 없는 재료이므로 쓰지 않습니다.
- 재료 이름은 목록에 적힌 글자 그대로 ingredients에 적습니다. 다른 언어로 번역하거나 줄이거나
  띄어쓰기를 바꾸지 않습니다.
  영어로 쓰라는 규칙은 설명 문장에만 적용되며 재료 이름에는 적용되지 않습니다.
- 각 음식에는 식후에 아이가 먹은 정도(outcome)와
  어려워한 이유(difficulty_reasons)가 함께 주어집니다.
  causes에는 제안을 만들 때 참고한 그 특성을 한 문장으로 서술합니다.
- 아이에게 먹기를 강요하지 않는 부드러운 표현을 씁니다.
- what_to_try, why_this_may_help, serving_tip, causes는 영어로 한두 문장씩 씁니다."""

COMPOSE_INSTRUCTION = """위 내용을 바탕으로 모든 음식에 대한 제안을 음식마다 하나씩 작성하세요.
food_id는 요청 목록의 id를 그대로 쓰고, ingredients에는 제안하는 음식에 들어가는 재료를
"쓸 수 있는 재료" 목록의 이름 그대로 적으세요.
cooking_method에는 제안하는 음식의 조리 방법을 고르세요."""


def _describe_food(food: FoodInput) -> str:
    parts = [f"id: {food.id}", f"name: {food.name}"]
    if food.ingredients:
        parts.append(f"ingredients: {', '.join(food.ingredients)}")
    if food.cooking_method:
        parts.append(f"cooking_method: {food.cooking_method}")
    if food.outcome:
        parts.append(f"outcome: {food.outcome}")
    if food.difficulty_reasons:
        parts.append(f"difficulty_reasons: {', '.join(food.difficulty_reasons)}")
    return "- " + ", ".join(parts)


def build_user_prompt(foods: list[FoodInput], catalog: Catalog) -> str:
    """음식 목록과 쓸 수 있는 재료 목록을 담은 첫 사용자 메시지."""
    lines = "\n".join(_describe_food(food) for food in foods)
    ingredients = "\n".join(sorted(catalog.names.values()))
    return (
        "아래 음식마다 제안을 만들 것입니다.\n\n"
        f"음식:\n{lines}\n\n"
        f"쓸 수 있는 재료 (한 줄에 하나):\n{ingredients}"
    )


def describe_problem(problem: ValidationProblem) -> str:
    """검증 문제 하나를 LLM이 고칠 수 있는 한 줄 지시문으로 바꾼다."""
    match problem.kind:
        case "missing_food":
            return f"food_id {problem.food_id}에 대한 제안이 빠졌습니다."
        case "unexpected_food":
            return f"요청하지 않은 food_id {problem.food_id}의 제안이 있습니다. 제거하세요."
        case "duplicate_food":
            return f"food_id {problem.food_id}의 제안이 여러 개입니다. 하나만 남기세요."
        case "blank_field":
            return f"food_id {problem.food_id}의 {problem.field}가 비어 있습니다."
        case "empty_ingredients":
            return f"food_id {problem.food_id}의 ingredients가 비어 있습니다."
        case "unavailable_ingredient":
            return (
                f"food_id {problem.food_id}의 재료 '{problem.ingredient}'은(는) "
                "쓸 수 있는 재료 목록에 없습니다. 목록에 있는 다른 재료로 바꾸세요."
            )


def build_retry_message(problems: list[ValidationProblem]) -> str:
    """직전 결과의 문제를 알리고 다시 작성하게 하는 메시지."""
    lines = "\n".join(f"- {describe_problem(problem)}" for problem in problems)
    return (
        f"직전에 작성한 제안에 다음 문제가 있습니다.\n{lines}\n\n"
        "문제를 모두 고쳐서 전체 제안을 다시 작성하세요."
    )
