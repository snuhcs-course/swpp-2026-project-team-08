# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""워크플로가 LLM에 보내는 프롬프트 모음.

검증 문제(`ValidationProblem`)는 문구 없이 데이터만 갖고 있으므로, 재시도 지시문은 여기서 만든다.
"""

from app.features.suggestions.workflow.state import FoodInput, ValidationProblem

SYSTEM_PROMPT = """당신은 편식하는 아이를 둔 부모를 돕는 식사 도우미입니다.
부모가 고른 음식마다, 다음 식사에서 아이와 시도해 볼 작은 한 걸음을 제안합니다.

규칙:
- 제안에 쓸 재료는 반드시 `search_available_ingredients` 도구로 이 아이가 쓸 수 있는지 확인합니다.
  도구가 돌려주지 않은 재료는 쓰지 않습니다.
- 도구에 후보 재료를 넘기면 그중 쓸 수 있는 재료만 받고,
  빈 목록으로 부르면 쓸 수 있는 재료 전체를 받습니다.
- 아이에게 먹기를 강요하지 않는 부드러운 표현을 씁니다.
- what_to_try, why_this_may_help, serving_tip은 영어로 한두 문장씩 씁니다."""

COMPOSE_INSTRUCTION = """지금까지 확인한 내용을 바탕으로
모든 음식에 대한 제안을 음식마다 하나씩 작성하세요.
food_id는 요청 목록의 id를 그대로 쓰고, used_ingredients에는 제안하는 음식에 들어가는 재료를
도구가 허용한 이름 그대로 적으세요."""


def build_user_prompt(foods: list[FoodInput]) -> str:
    """음식 목록을 담은 첫 사용자 메시지."""
    lines = "\n".join(f"- id: {food.id}, name: {food.name}" for food in foods)
    return (
        "아래 음식마다 제안을 만들 것입니다. 먼저 도구로 쓸 수 있는 재료를 확인하세요.\n\n"
        f"음식:\n{lines}"
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
            return f"food_id {problem.food_id}의 used_ingredients가 비어 있습니다."
        case "unknown_ingredient":
            return (
                f"food_id {problem.food_id}의 재료 '{problem.ingredient}'은(는) "
                "알 수 없는 재료입니다. 도구로 확인한 재료만 쓰세요."
            )
        case "restricted_ingredient":
            return (
                f"food_id {problem.food_id}의 재료 '{problem.ingredient}'은(는) "
                f"이 아이가 쓸 수 없습니다 (제한: {', '.join(problem.restrictions)}). "
                "다른 재료로 바꾸세요."
            )


def build_retry_message(problems: list[ValidationProblem]) -> str:
    """직전 결과의 문제를 알리고 다시 작성하게 하는 메시지."""
    lines = "\n".join(f"- {describe_problem(problem)}" for problem in problems)
    return (
        f"직전에 작성한 제안에 다음 문제가 있습니다.\n{lines}\n\n"
        "문제를 모두 고쳐서 전체 제안을 다시 작성하세요."
    )
