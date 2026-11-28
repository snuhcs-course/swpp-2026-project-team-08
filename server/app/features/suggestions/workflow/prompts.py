# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 기능 제거
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 추천 문맥 반영
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 도구 대신 쓸 수 있는 재료 목록을 프롬프트에 담고 조리법·원인 지시 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 어려워한 이유 활용 지시, 재료별 결과와 아이가 잘 먹는 음식 구역 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 추가 추천 생성 시 기존 거절 제안과 사유 반영
# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 영어 전환 전후 카탈로그 재료명 그대로 사용
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 시스템 프롬프트 구역 재구성, 이유·결과·조리법 코드를 설명으로 풀고 가드레일 피드백 추가
# AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
# Changed: 연령대·편식 가설·거부 음식·추천 이력을 바탕으로 음식을 추천하는 프롬프트로 개편

"""워크플로가 LLM에 보내는 프롬프트 모음.

검증 문제(`ValidationProblem`)는 문구 없이 데이터만 갖고 있으므로, 재시도 지시문은 여기서 만든다.
"""

from app.features.suggestions.ingredients import Catalog
from app.features.suggestions.workflow.age_groups import describe_age_group
from app.features.suggestions.workflow.cooking_methods import describe_cooking_method
from app.features.suggestions.workflow.decisions import describe_dismiss_reason, describe_status
from app.features.suggestions.workflow.outcomes import describe_outcome
from app.features.suggestions.workflow.reasons import describe_reason
from app.features.suggestions.workflow.state import (
    DifficultFood,
    FamiliarEatenFood,
    FamiliarFoods,
    IngredientResult,
    PastRecommendation,
    RefusedFood,
    ValidationProblem,
)

SYSTEM_PROMPT = """당신은 편식하는 아이를 둔 보호자를 돕는 식사 도우미입니다.
아이의 기록을 바탕으로, 아이가 편식하지 않고 먹을 가능성이 높은 음식을 추천합니다.

## 목표
- 사용자 메시지에 적힌 개수만큼, 서로 다른 음식을 하나씩 추천합니다.
- 아이가 잘 먹는 음식에서 출발해, 아이가 어려워한 특성을 피하거나 줄인 음식을 고릅니다.
- 아이를 치료하거나 고치려는 것이 아니라, 보호자가 시도해 볼 음식을 제안하는 것입니다.
  아이에게 먹기를 강요하지 않는 부드러운 표현을 씁니다.

## 입력 읽는 법
사용자 메시지는 다음 구역으로 이루어집니다. 기록이 없는 구역은 생략됩니다.
1. 아이: 아이의 연령대입니다.
2. 잘 먹지 못한 음식: 최근 식후 리뷰에서 아이가 잘 먹지 못한 음식입니다.
   항목마다 다음이 적혀 있습니다.
   - name, ingredients, cooking_method: 음식의 기본 정보.
   - outcome: 아이가 그 음식을 어느 정도 먹었는지를 문장으로 적은 것.
   - difficulty_reasons: 보호자가 추정한, 아이가 먹기 어려웠던 까닭.
     "과일 향이 나서", "맛이 셔서"처럼 "~해서" 문장이고 여러 개면 ' / '로 구분됩니다.
     적힌 뜻 그대로만 읽고 덧붙이지 않습니다.
   - ingredient_results: 보호자가 재료별로 따로 기록한 outcome과 어려워한 이유.
3. 아이가 평소 잘 먹는 음식: 과거 식사에서 잘 먹은 음식입니다.
   기록은 적힌 조리·제공 형태에만 해당합니다.
4. 아이가 거부한 음식: 보호자가 기록한 거부 음식과 그 조리법·이유입니다. 이유는 보호자가 추정한
   가설이며, 알려진 형태에 대한 참고 정보일 뿐 알레르기나 영구적인 금지로 해석하지 않습니다.
5. 지금까지 추천한 음식: 이전에 추천한 음식 이름과 보호자의 결정, 거절했다면 그 이유입니다.
6. 쓸 수 있는 재료: 이 아이가 쓸 수 있는 재료 이름 목록입니다. 항상 마지막 구역입니다.

## 추천하는 방법
1. 어려워한 이유는 보호자가 추정한 가설이며 사실로 단정하지 않습니다. 여러 음식에서 반복되는 이유는
   아이의 편식 경향일 가능성이 높은 근거로, 한 번만 나온 이유는 약한 단서로 봅니다.
2. 경향으로 보이는 어려움을 피하거나 줄일 수 있는 음식을 고르고, 그 어려움을 줄이는 조리·손질·크기·
   제공 방식을 preparation_method에 적습니다.
3. 아이가 잘 먹는 음식이 있으면 그 음식과 식감·맛·재료·조리법이 비슷하거나 함께 낼 수 있는 음식을
   우선합니다. 관련된 음식이 없으면 억지로 연결하지 않습니다.
4. 연령대에 맞는 음식·식감·크기를 고릅니다. 어린 아이에게는 단단하거나 작고 둥근 음식처럼 삼키기
   어려운 형태를 피하거나, 안전하게 손질하는 방법을 preparation_method에 적습니다.
5. 잘 먹지 못한 음식과 잘 먹는 음식의 기록이 없으면 연령대와 쓸 수 있는 재료만으로 그 나이의 아이가
   받아들이기 쉬운 음식을 추천합니다. 이때 기록에 근거한 개인화된 이유를 지어내지 않습니다.

## 지킬 것
- 재료: "쓸 수 있는 재료" 목록에 있는 재료로 만들 수 있는 음식만 추천합니다.
  목록에 없는 재료는 이 아이가 쓸 수 없거나 알 수 없는 재료이므로 추천하는 음식에 넣지 않습니다.
  재료 이름은 목록에 적힌 글자 그대로 쓰고, 번역하거나 줄이거나 띄어쓰기를 바꾸지 않습니다.
  영어로 쓰라는 규칙은 설명 문장에만 적용됩니다.
- 익숙한 음식의 재료: 익숙한 음식에 목록에 없는 재료가 들어 있어도 쓰지 않습니다.
  익숙한 음식은 추천의 근거일 뿐 재료를 고르는 기준이 아닙니다.
- 근거: 기록에 없는 반응이나 이유를 지어내지 않습니다. outcome이 "얼마나 먹었는지 확인하지
  못했다"이거나, 어려워한 이유가 없거나, "이유를 잘 모르겠다"뿐이면 이유를 추측하지 않습니다.
- 익숙한 음식의 형태: 이름이 같다고 해서 다른 재료·조리·제공 형태도 잘 먹는다고 단정하지 않습니다.
- 지금까지 추천한 음식: 같은 음식을 다시 추천하지 않습니다. 거절 이유는 보호자의 판단이며
  아이가 실제 보인 식후 반응으로 해석하지 않습니다. 거절 이유가 있으면 같은 이유로 거절될 만한
  음식은 피합니다.

## 출력 작성
- 추천은 요청한 개수만큼 정확히 쓰고, 각 추천은 서로 다른 음식입니다.
- what_to_try, why_this_may_help, preparation_method는 영어로 씁니다.
  - what_to_try: 추천하는 음식 하나의 이름.
  - why_this_may_help: 이 음식이 도움이 될 수 있는 이유를 한두 문장으로. 근거로 삼은 기록(잘 먹는
    음식, 반복되는 어려움, 연령대)을 밝히고, 어려워한 이유는 단정하지 않는 표현으로 씁니다.
  - preparation_method: 편식을 덜기 위해 이 음식을 제공할 때 고려할 사항을 한두 문장으로.
- ingredients: 추천한 음식에 들어가는 재료를 "쓸 수 있는 재료" 목록의 이름으로 빠짐없이 모두 씁니다.
  설명에 나오는 재료도 빠뜨리지 않습니다."""

COMPOSE_INSTRUCTION = """위 내용을 바탕으로, 시스템 지침에 따라 요청한 개수만큼 음식 추천을
작성하세요."""


def _describe_reasons(codes: tuple[str, ...]) -> str:
    """이유 코드를 코드 대신 설명으로 풀어 ' / '로 잇는다."""
    return " / ".join(describe_reason(code) for code in codes)


def _describe_difficult_food(food: DifficultFood) -> str:
    parts = [f"name: {food.name}"]
    if food.ingredients:
        parts.append(f"ingredients: {', '.join(food.ingredients)}")
    if food.cooking_method:
        parts.append(f"cooking_method: {describe_cooking_method(food.cooking_method)}")
    parts.append(f"outcome: {describe_outcome(food.outcome)}")
    if food.difficulty_reasons:
        parts.append(f"difficulty_reasons: {_describe_reasons(food.difficulty_reasons)}")
    if food.ingredient_results:
        parts.append(
            "ingredient_results: "
            + "; ".join(_describe_ingredient_result(item) for item in food.ingredient_results)
        )
    return "- " + ", ".join(parts)


def _describe_ingredient_result(result: IngredientResult) -> str:
    detail = f"outcome: {describe_outcome(result.outcome)}"
    if result.difficulty_reasons:
        detail += f", difficulty_reasons: {_describe_reasons(result.difficulty_reasons)}"
    return f"{result.name} ({detail})"


def _describe_eaten_food(food: FamiliarEatenFood) -> str:
    parts = [food.name]
    if food.cooking_method:
        parts.append(f"cooking_method: {describe_cooking_method(food.cooking_method)}")
    if food.ingredients:
        parts.append(f"ingredients: {', '.join(food.ingredients)}")
    return "- " + ", ".join(parts)


def _describe_refused_food(food: RefusedFood) -> str:
    parts = [food.name]
    if food.cooking_method:
        parts.append(f"cooking_method: {describe_cooking_method(food.cooking_method)}")
    if food.reasons:
        parts.append(f"difficulty_reasons: {_describe_reasons(food.reasons)}")
    return "- " + ", ".join(parts)


def _describe_past_recommendation(item: PastRecommendation) -> str:
    parts = [item.what_to_try, f"decision: {describe_status(item.status)}"]
    if item.dismiss_reasons:
        reasons = " / ".join(describe_dismiss_reason(code) for code in item.dismiss_reasons)
        parts.append(f"dismiss_reasons: {reasons}")
    return "- " + ", ".join(parts)


def _section(heading: str, lines: list[str]) -> str:
    """제목과 항목 줄로 구역 하나를 만든다. 항목이 없으면 빈 문자열이다."""
    if not lines:
        return ""
    return f"{heading}:\n" + "\n".join(lines) + "\n\n"


def _familiar_sections(familiar: FamiliarFoods) -> str:
    """아이가 잘 먹은 음식과 거부한 음식 구역. 기록이 없으면 빈 문자열이다."""
    return _section(
        "과거 식사에서 아이가 잘 먹은 음식 (식후 리뷰에 '잘 먹었다'로 기록)",
        [_describe_eaten_food(food) for food in familiar.eaten_foods],
    ) + _section(
        "아이가 거부한 음식 (보호자 기록, 이유는 보호자가 추정한 가설)",
        [_describe_refused_food(food) for food in familiar.refused_foods],
    )


def build_user_prompt(
    *,
    count: int,
    age_group: str,
    difficult_foods: tuple[DifficultFood, ...],
    familiar: FamiliarFoods,
    history: tuple[PastRecommendation, ...],
    catalog: Catalog,
) -> str:
    """아이에게 추천할 음식을 만들기 위한 첫 사용자 메시지.

    아이 정보, 잘 먹지 못한 음식, 잘 먹은 음식, 거부한 음식, 추천 이력, 쓸 수 있는 재료를
    차례로 담는다. 쓸 수 있는 재료 목록은 항상 마지막 구역이다.
    """
    ingredients = "; ".join(sorted(catalog.names.values()))
    return (
        f"아이에게 추천할 음식 {count}개를 만들 것입니다.\n\n"
        f"아이:\n- 연령대: {describe_age_group(age_group)}\n\n"
        + _section(
            "잘 먹지 못한 음식 (어려워한 이유는 보호자가 추정한 가설)",
            [_describe_difficult_food(food) for food in difficult_foods],
        )
        + _familiar_sections(familiar)
        + _section(
            "지금까지 추천한 음식 (같은 음식은 다시 추천하지 않음)",
            [_describe_past_recommendation(item) for item in history],
        )
        + f"쓸 수 있는 재료 (세미콜론 ';'으로 구분, 이름 안의 쉼표는 이름의 일부):\n{ingredients}"
    )


def describe_problem(problem: ValidationProblem) -> str:
    """검증 문제 하나를 LLM이 고칠 수 있는 한 줄 지시문으로 바꾼다."""
    target = f"추천 {(problem.position or 0) + 1}"
    match problem.kind:
        case "wrong_count":
            return (
                f"추천이 {problem.count}개입니다. 사용자 메시지에 적힌 개수만큼 정확히 작성하세요."
            )
        case "blank_field":
            return f"{target}의 {problem.field}가 비어 있습니다."
        case "empty_ingredients":
            return f"{target}의 ingredients가 비어 있습니다."
        case "unavailable_ingredient":
            return (
                f"{target}의 재료 '{problem.ingredient}'은(는) "
                "쓸 수 있는 재료 목록에 없습니다. 목록에 있는 다른 재료로 바꾸세요."
            )
        case "duplicate_food":
            return f"{target}의 음식이 앞선 추천과 같습니다. 다른 음식으로 바꾸세요."
        case "repeated_food":
            return f"{target}의 음식은 지금까지 추천한 음식입니다. 다른 음식으로 바꾸세요."
        case "restriction_risk" if problem.ingredient:
            return (
                f"{target}의 재료 '{problem.ingredient}'은(는) "
                "이 아이의 식이 제한에 어긋날 가능성이 높다고 판정되었습니다. "
                "이 재료를 빼거나 다른 재료로 바꾸세요."
            )
        case "restriction_risk":
            return (
                f"{target}의 문장(what_to_try, why_this_may_help, preparation_method)에 "
                "이 아이가 먹을 수 없는 재료나 음식이 들어 있을 가능성이 높다고 판정되었습니다. "
                "문장에서 그런 재료나 음식을 빼고 다시 쓰세요."
            )


def build_retry_message(problems: list[ValidationProblem]) -> str:
    """직전 결과의 문제를 알리고 다시 작성하게 하는 메시지."""
    lines = "\n".join(f"- {describe_problem(problem)}" for problem in problems)
    return (
        f"직전에 작성한 추천에 다음 문제가 있습니다.\n{lines}\n\n"
        "문제를 모두 고쳐서 전체 추천을 다시 작성하세요."
    )
