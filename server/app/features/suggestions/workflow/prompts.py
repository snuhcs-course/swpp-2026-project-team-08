# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow

"""워크플로가 LLM에 보내는 프롬프트 모음.

검증 문제(`ValidationProblem`)는 문구 없이 데이터만 갖고 있으므로, 재시도 지시문은 여기서 만든다.
"""

from app.features.suggestions.workflow.state import (
    ChildContext,
    FoodInput,
    ValidationProblem,
)

# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
SYSTEM_PROMPT = """당신은 편식하는 아이를 둔 부모를 돕는 식사 도우미입니다.
부모가 고른 음식(또는 재료)마다, 다음 식사에서 아이와 시도해 볼 작은 한 걸음을 제안합니다.

규칙:
- 제안은 아이가 잘 먹는 음식 쪽으로 대상의 특징 일부(조리법, 질감, 온도, 모양, 곁들임 등)를
  살짝만 바꾸는 방식으로 만듭니다. 한 번에 많이 바꾸지 않습니다.
- 제안에 쓰는 재료는 반드시 '쓸 수 있는 재료' 목록에 있는 것만 씁니다. 목록에 없는 재료는
  쓰지 않습니다. used_ingredients에는 목록에 적힌 이름 그대로 적습니다.
- 아이의 제한 정보에 적힌 알러지와 식이 제한을 지킵니다.
- 아이에게 먹기를 강요하지 않는 부드러운 표현을 씁니다.
- food_id는 대상 목록의 id를 그대로 쓰고, 대상마다 제안을 하나씩 작성합니다.
- what_to_try, why_this_may_help, serving_tip은 영어로 한두 문장씩 씁니다."""


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def _join(values: tuple[str, ...]) -> str:
    return ", ".join(values) if values else "없음"


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def _describe_child(child: ChildContext) -> str:
    """아이의 정보를 프롬프트에 넣을 줄로 바꾼다. 값이 없는 항목은 뺀다."""
    singles = [
        ("나이대", child.age_group),
        ("냄새에 민감한 정도", child.smell_sensitivity),
        ("선호하는 온도", child.preferred_temperature),
        ("새 음식에 대한 반응", child.new_food_response),
    ]
    lines = [f"- {label}: {value}" for label, value in singles if value]
    multiples = [
        ("힘들어하는 질감", child.difficult_textures),
        ("힘들어하는 맛", child.difficult_tastes),
        ("선호하는 담음새", child.presentation_preferences),
        ("직접 입력한 알러지 · 식이 제한", child.other_restrictions),
    ]
    lines += [f"- {label}: {_join(values)}" for label, values in multiples if values]
    return "\n".join(lines) or "- 없음"


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def _describe_safe_foods(child: ChildContext) -> str:
    lines = []
    for food in child.safe_foods:
        line = f"- {food.name} ({food.preparation})"
        if food.presentation_note:
            line += f", 담는 방식: {food.presentation_note}"
        lines.append(line)
    return "\n".join(lines) or "- 없음"


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def _describe_target(food: FoodInput) -> str:
    """제안 대상 하나를 여러 줄로 풀어 쓴다."""
    lines = [f"- id: {food.id}, name: {food.name}"]
    if food.parent_food:
        lines.append(f"  - 들어 있던 음식: {food.parent_food}")
    if food.ingredients:
        lines.append(f"  - 재료: {_join(food.ingredients)}")
    if food.cooking_method:
        lines.append(f"  - 조리법: {food.cooking_method}")
    if food.serving_note:
        lines.append(f"  - 담은 방식 메모: {food.serving_note}")
    if food.outcome:
        lines.append(f"  - 먹은 결과: {food.outcome}")
    for difficulty in food.difficulties:
        detail = "/".join(part for part in (difficulty.subcategory, difficulty.value) if part)
        lines.append(f"  - 어려웠던 점: {difficulty.category} - {detail}")
    return "\n".join(lines)


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
def build_user_prompt(
    foods: list[FoodInput], child: ChildContext, usable_ingredients: list[str]
) -> str:
    """대상 · 아이 정보 · 쓸 수 있는 재료를 담은 첫 사용자 메시지."""
    targets = "\n".join(_describe_target(food) for food in foods)
    return (
        "아래 대상마다 제안을 만들어 주세요.\n\n"
        f"[제안 대상]\n{targets}\n\n"
        f"[아이가 잘 먹는 음식]\n{_describe_safe_foods(child)}\n\n"
        f"[최근 손도 대지 않은 음식]\n{_join(child.refused_foods)}\n\n"
        f"[최근 손도 대지 않은 재료]\n{_join(child.refused_ingredients)}\n\n"
        f"[아이의 제한 정보]\n{_describe_child(child)}\n\n"
        f"[쓸 수 있는 재료 - 이 밖의 재료는 쓰지 않습니다]\n{', '.join(usable_ingredients)}"
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
                "쓸 수 있는 재료 목록에 없습니다. 목록에 있는 재료만 쓰세요."
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
