# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 대신 쓸 수 있는 재료 목록을 프롬프트에 담고 조리법·원인 지시 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 어려워한 이유 활용 지시, 재료별 결과와 아이가 잘 먹는 음식 구역 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 추가 추천 생성 시 기존 거절 제안과 사유 반영
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 시스템 프롬프트 구역 재구성, 이유·결과·조리법 코드를 설명으로 풀고 가드레일 피드백 추가

"""워크플로가 LLM에 보내는 프롬프트 모음.

검증 문제(`ValidationProblem`)는 문구 없이 데이터만 갖고 있으므로, 재시도 지시문은 여기서 만든다.
"""

from app.features.suggestions.ingredients import Catalog
from app.features.suggestions.workflow.cooking_methods import describe_cooking_method
from app.features.suggestions.workflow.outcomes import describe_outcome
from app.features.suggestions.workflow.reasons import describe_reason
from app.features.suggestions.workflow.state import (
    FamiliarEatenFood,
    FamiliarFoods,
    FamiliarSafeFood,
    FoodInput,
    IngredientResult,
    ValidationProblem,
)

SYSTEM_PROMPT = """당신은 편식하는 아이를 둔 보호자를 돕는 식사 도우미입니다.
보호자가 고른 음식마다, 다음 식사에서 아이와 시도해 볼 작은 변화 하나를 제안합니다.

## 목표
- 사용자 메시지의 음식은 보호자가 식사 후 기록한, 아이가 잘 먹지 못한 음식입니다.
- 방향은 못 먹은 음식에서 아이가 잘 먹는 음식 쪽으로 조금씩 다가가는 것입니다.
  못 먹은 음식과 그 어려워한 이유에서 출발해, 한 번에 하나만 조금 바꿉니다.
- 아이를 치료하거나 고치려는 것이 아니라, 보호자가 시도해 볼 작은 변화를 제안하는 것입니다.
  아이에게 먹기를 강요하지 않는 부드러운 표현을 씁니다.

## 입력 읽는 법
사용자 메시지는 다음 구역으로 이루어집니다. 기록이 없는 구역은 생략됩니다.
1. 음식: 제안할 음식 목록입니다. 항목마다 다음이 적혀 있습니다.
   - id, name, ingredients, cooking_method: 음식의 기본 정보.
   - outcome: 아이가 그 음식을 어느 정도 먹었는지를 문장으로 적은 것.
   - difficulty_reasons: 보호자가 고른, 아이가 먹기 어려웠던 까닭. "과일 향이 나서", "맛이 셔서"처럼
     "~해서" 문장이고 여러 개면 ' / '로 구분됩니다. 적힌 뜻 그대로만 읽고 덧붙이지 않습니다.
   - ingredient_results: 보호자가 재료별로 따로 기록한 outcome과 어려워한 이유.
   - rejected_suggestion: 보호자가 거절한 기존 제안과 제외 이유.
2. 아이가 평소 잘 먹는 음식: 보호자가 적은 safe food와 과거 식사에서 잘 먹은 음식입니다.
   기록은 적힌 조리·제공 형태에만 해당합니다.
3. 쓸 수 있는 재료: 이 아이가 쓸 수 있는 재료 이름 목록입니다. 항상 마지막 구역입니다.

## 제안하는 방법
1. 어려워한 이유는 제안의 출발점입니다. 주어진 이유 중 하나 이상을 골라, 그 이유를 직접 줄이는
   조리·손질·제공 방식의 변화 하나를 what_to_try에 담습니다.
   이유와 상관없는 일반적인 제안은 하지 않습니다.
2. ingredient_results가 있으면 어려움이 그 재료 때문인지 음식 전체 때문인지 구분해 반영합니다.
   재료 하나만 어려워했다면 그 재료를 바꾸거나 다르게 손질하는 쪽을 우선합니다.
3. 아이가 잘 먹는 음식이 있으면 그중 관련된 하나 쪽으로 한 걸음 가깝게 바꿉니다.
   예: 잘 먹는 음식과 비슷한 식감·조리법·재료로 바꾸기, 잘 먹는 음식에 곁들이기.
   관련된 음식이 없으면 억지로 연결하지 않고 어려워한 이유를 줄이는 변화만 제안합니다.
4. rejected_suggestion이 있으면 같은 제안을 반복하지 말고 다른 작은 변화를 제안합니다.
   다른 제안에도 아래 지킬 것을 모두 적용합니다.

## 지킬 것
- 재료: "쓸 수 있는 재료" 목록에 있는 재료로 만들 수 있는 음식만 제안합니다.
  목록에 없는 재료는 이 아이가 쓸 수 없거나 알 수 없는 재료이므로 제안하는 음식에 넣지 않습니다.
  재료 이름은 목록에 적힌 글자 그대로 쓰고, 번역하거나 줄이거나 띄어쓰기를 바꾸지 않습니다.
  영어로 쓰라는 규칙은 설명 문장에만 적용됩니다.
- 익숙한 음식의 재료: 익숙한 음식에 목록에 없는 재료가 들어 있어도 쓰지 않습니다.
  익숙한 음식은 제안의 근거일 뿐 재료를 고르는 기준이 아닙니다.
- 근거: 기록에 없는 반응이나 이유를 지어내지 않습니다. outcome이 "얼마나 먹었는지 확인하지
  못했다"이거나, 어려워한 이유가 없거나, "이유를 잘 모르겠다"뿐이면 이유를 추측하지 않습니다.
- 익숙한 음식의 형태: 이름이 같다고 해서 다른 재료·조리·제공 형태도 잘 먹는다고 단정하지 않습니다.
- 제외 이유: rejected_suggestion의 제외 이유를 아이가 실제 보인 식후 반응으로 해석하지 않습니다.

## 출력 작성
- food_id는 요청한 id를 그대로 쓰고, 음식마다 제안 하나를 작성합니다.
- what_to_try, why_this_may_help, serving_tip, causes는 영어로 한두 문장씩 씁니다.
  - what_to_try: 다음 식사에서 시도할 작은 변화 하나.
  - why_this_may_help: 왜 도움이 될 수 있는지. 익숙한 음식과 이었다면 어떤 음식 쪽으로
    다가가는지 밝힙니다.
  - serving_tip: 제공 방법에 관한 간결한 팁.
  - causes: 제안의 근거로 삼은 어려워한 이유(없으면 기록된 outcome)를 한 문장으로.
- ingredients: 제안한 음식에 들어가는 재료를 "쓸 수 있는 재료" 목록의 이름으로 빠짐없이 모두 씁니다.
  제안 설명에 나오는 재료도 빠뜨리지 않습니다.
- cooking_method: 제안한 음식의 조리 방법입니다."""

COMPOSE_INSTRUCTION = """위 내용을 바탕으로, 시스템 지침에 따라 모든 음식에 대한 제안을
음식마다 하나씩 작성하세요."""


def _describe_reasons(codes: tuple[str, ...]) -> str:
    """이유 코드를 코드 대신 설명으로 풀어 ' / '로 잇는다."""
    return " / ".join(describe_reason(code) for code in codes)


def _describe_food(food: FoodInput) -> str:
    parts = [f"id: {food.id}", f"name: {food.name}"]
    if food.ingredients:
        parts.append(f"ingredients: {', '.join(food.ingredients)}")
    if food.cooking_method:
        parts.append(f"cooking_method: {describe_cooking_method(food.cooking_method)}")
    if food.outcome:
        parts.append(f"outcome: {describe_outcome(food.outcome)}")
    if food.difficulty_reasons:
        parts.append(f"difficulty_reasons: {_describe_reasons(food.difficulty_reasons)}")
    if food.ingredient_results:
        parts.append(
            "ingredient_results: "
            + "; ".join(_describe_ingredient_result(item) for item in food.ingredient_results)
        )
    if food.rejected_suggestion:
        previous = food.rejected_suggestion
        parts.append(
            "rejected_suggestion: "
            + repr(
                {
                    "what_to_try": previous.what_to_try,
                    "why_this_may_help": previous.why_this_may_help,
                    "serving_tip": previous.serving_tip,
                    "dismiss_reasons": previous.dismiss_reasons,
                }
            )
        )
    return "- " + ", ".join(parts)


def _describe_ingredient_result(result: IngredientResult) -> str:
    detail = f"outcome: {describe_outcome(result.outcome)}"
    if result.difficulty_reasons:
        detail += f", difficulty_reasons: {_describe_reasons(result.difficulty_reasons)}"
    return f"{result.name} ({detail})"


def _describe_safe_food(food: FamiliarSafeFood) -> str:
    parts = [food.name]
    if food.preparation:
        parts.append(f"cooking: {food.preparation}")
    if food.presentation_note:
        parts.append(f"note: {food.presentation_note}")
    return "- " + ", ".join(parts)


def _describe_eaten_food(food: FamiliarEatenFood) -> str:
    parts = [food.name]
    if food.cooking_method:
        parts.append(f"cooking_method: {describe_cooking_method(food.cooking_method)}")
    if food.ingredients:
        parts.append(f"ingredients: {', '.join(food.ingredients)}")
    return "- " + ", ".join(parts)


def _familiar_sections(familiar: FamiliarFoods) -> str:
    """아이가 잘 먹는 음식 구역. 기록이 없으면 빈 문자열이다."""
    sections = []
    if familiar.safe_foods:
        lines = "\n".join(_describe_safe_food(food) for food in familiar.safe_foods)
        sections.append(f"아이가 평소 잘 먹는 음식 (보호자가 적은 safe food):\n{lines}")
    if familiar.eaten_foods:
        lines = "\n".join(_describe_eaten_food(food) for food in familiar.eaten_foods)
        heading = "과거 식사에서 아이가 잘 먹은 음식 (식후 리뷰에 '잘 먹었다'로 기록)"
        sections.append(f"{heading}:\n{lines}")
    return "".join(f"{section}\n\n" for section in sections)


def build_user_prompt(
    foods: list[FoodInput], catalog: Catalog, familiar: FamiliarFoods | None = None
) -> str:
    """음식 목록, 아이가 잘 먹는 음식, 쓸 수 있는 재료 목록을 담은 첫 사용자 메시지.

    쓸 수 있는 재료 목록은 항상 마지막 구역이다.
    """
    lines = "\n".join(_describe_food(food) for food in foods)
    ingredients = "; ".join(sorted(catalog.names.values()))
    return (
        "아래 음식마다 제안을 만들 것입니다.\n\n"
        f"음식:\n{lines}\n\n"
        f"{_familiar_sections(familiar or FamiliarFoods())}"
        f"쓸 수 있는 재료 (세미콜론 ';'으로 구분, 이름 안의 쉼표는 이름의 일부):\n{ingredients}"
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
        case "restriction_risk" if problem.ingredient:
            return (
                f"food_id {problem.food_id}의 재료 '{problem.ingredient}'은(는) "
                "이 아이의 식이 제한에 어긋날 가능성이 높다고 판정되었습니다. "
                "이 재료를 빼거나 다른 재료로 바꾸세요."
            )
        case "restriction_risk":
            return (
                f"food_id {problem.food_id}의 제안 문장"
                "(what_to_try, why_this_may_help, serving_tip)에 "
                "이 아이가 먹을 수 없는 재료나 음식이 들어 있을 가능성이 높다고 판정되었습니다. "
                "문장에서 그런 재료나 음식을 빼고 다시 쓰세요."
            )


def build_retry_message(problems: list[ValidationProblem]) -> str:
    """직전 결과의 문제를 알리고 다시 작성하게 하는 메시지."""
    lines = "\n".join(f"- {describe_problem(problem)}" for problem in problems)
    return (
        f"직전에 작성한 제안에 다음 문제가 있습니다.\n{lines}\n\n"
        "문제를 모두 고쳐서 전체 제안을 다시 작성하세요."
    )
