# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 제안이 아이의 제한에 어긋날 확률을 묻는 질문과 판정 해석 추가

"""가드레일의 순수 함수: 판정 모델에 보낼 질문을 만들고, 돌아온 확률을 문제로 바꾼다.

판정 모델(Jev)은 설명을 돌려주지 않고 질문마다 '예'일 확률만 돌려준다. 그래서 제안의 재료마다,
그리고 제안 문장 전체에 대해 질문을 따로 만들어 어디가 위험한지 알 수 있게 한다.
네트워크 호출은 노드가 맡고 이 모듈은 입출력만 변환한다.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from app.features.suggestions.workflow.state import GeneratedSuggestion, ValidationProblem

RESTRICTIONS_KEY = "child_restrictions"
SUGGESTIONS_KEY = "suggestions"


@dataclass(frozen=True)
class JudgementRequest:
    """판정 모델에 보낼 값과, 질문 이름이 가리키는 대상.

    `targets` 는 질문 이름 → (food_id, 재료 이름). 재료 이름이 `None` 이면 제안 문장 전체다.
    """

    state: dict[str, Any]
    questions: dict[str, str]
    targets: dict[str, tuple[str, str | None]]


def _ingredient_question(food_id: str, ingredient: str) -> str:
    return (
        f"food_id {food_id} 제안의 재료 '{ingredient}'은(는) {RESTRICTIONS_KEY} 중 하나라도 "
        "어겨서 이 아이가 먹을 수 없는 재료입니까?"
    )


def _text_question(food_id: str) -> str:
    return (
        f"food_id {food_id} 제안의 what_to_try, why_this_may_help, serving_tip 문장에 "
        f"{RESTRICTIONS_KEY} 중 하나라도 어겨서 이 아이가 먹을 수 없는 재료나 음식이 "
        "들어 있습니까? 재료 목록에 없더라도 문장에 나온 것은 포함해서 판단하세요."
    )


def build_request(
    restrictions: tuple[str, ...], results: list[GeneratedSuggestion]
) -> JudgementRequest:
    """제안마다 문장 질문 하나와 재료별 질문을 만든다."""
    questions: dict[str, str] = {}
    targets: dict[str, tuple[str, str | None]] = {}
    for result in results:
        text_name = f"food{result.food_id}_text"
        questions[text_name] = _text_question(result.food_id)
        targets[text_name] = (result.food_id, None)
        for position, ingredient in enumerate(result.ingredients):
            name = f"food{result.food_id}_ingredient{position}"
            questions[name] = _ingredient_question(result.food_id, ingredient)
            targets[name] = (result.food_id, ingredient)
    state = {
        RESTRICTIONS_KEY: list(restrictions),
        SUGGESTIONS_KEY: [
            {
                "food_id": result.food_id,
                "what_to_try": result.what_to_try,
                "why_this_may_help": result.why_this_may_help,
                "serving_tip": result.serving_tip,
                "ingredients": list(result.ingredients),
                "cooking_method": result.cooking_method.value,
            }
            for result in results
        ],
    }
    return JudgementRequest(state=state, questions=questions, targets=targets)


def find_risks(
    request: JudgementRequest, probabilities: Mapping[str, float], threshold: float
) -> list[ValidationProblem]:
    """위험 확률이 임계값 이상인 대상마다 문제 하나를 만든다.

    질문에 대한 답이 빠져 있으면 `KeyError` 를 낸다. 판정할 수 없으면 통과시키지 않는다.
    """
    return [
        ValidationProblem(
            kind="restriction_risk",
            food_id=food_id,
            ingredient=ingredient,
            risk=probabilities[name],
        )
        for name, (food_id, ingredient) in request.targets.items()
        if probabilities[name] >= threshold
    ]
