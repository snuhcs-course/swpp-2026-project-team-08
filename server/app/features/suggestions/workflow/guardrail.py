# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 제안이 아이의 제한에 어긋날 확률을 묻는 질문과 판정 해석 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 질문 대상을 음식 id 대신 추천 순서로, 판정 문장에 제공 방법을 포함

"""가드레일의 순수 함수: 판정 모델에 보낼 질문을 만들고, 돌아온 확률을 문제로 바꾼다.

판정 모델(Jev)은 설명을 돌려주지 않고 질문마다 '예'일 확률만 돌려준다. 그래서 추천의 재료마다,
그리고 추천 문장 전체에 대해 질문을 따로 만들어 어디가 위험한지 알 수 있게 한다.
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

    `targets` 는 질문 이름 → (추천 순서, 재료 이름). 재료 이름이 `None` 이면 추천 문장 전체다.
    """

    state: dict[str, Any]
    questions: dict[str, str]
    targets: dict[str, tuple[int, str | None]]


def _ingredient_question(position: int, ingredient: str) -> str:
    return (
        f"{SUGGESTIONS_KEY}[{position}] 추천의 재료 '{ingredient}'은(는) {RESTRICTIONS_KEY} 중 "
        "하나라도 어겨서 이 아이가 먹을 수 없는 재료입니까?"
    )


def _text_question(position: int) -> str:
    return (
        f"{SUGGESTIONS_KEY}[{position}] 추천의 what_to_try, why_this_may_help, "
        "preparation_method 문장만 보고 판단하세요. "
        f"이 문장들이 {RESTRICTIONS_KEY} 중 하나라도 어겨서 이 아이가 먹을 수 없는 재료나 음식을 "
        "먹이거나 곁들이라고 권합니까? ingredients 필드의 재료는 따로 판단하므로 이 질문에서는 "
        "고려하지 마세요. 먹이지 않겠다고 배제하는 표현은 해당하지 않습니다."
    )


def build_request(
    restrictions: tuple[str, ...], results: list[GeneratedSuggestion]
) -> JudgementRequest:
    """추천마다 문장 질문 하나와 재료별 질문을 만든다."""
    questions: dict[str, str] = {}
    targets: dict[str, tuple[int, str | None]] = {}
    for position, result in enumerate(results):
        text_name = f"suggestion{position}_text"
        questions[text_name] = _text_question(position)
        targets[text_name] = (position, None)
        for index, ingredient in enumerate(result.ingredients):
            name = f"suggestion{position}_ingredient{index}"
            questions[name] = _ingredient_question(position, ingredient)
            targets[name] = (position, ingredient)
    state = {
        RESTRICTIONS_KEY: list(restrictions),
        SUGGESTIONS_KEY: [
            {
                "what_to_try": result.what_to_try,
                "why_this_may_help": result.why_this_may_help,
                "ingredients": list(result.ingredients),
                "preparation_method": result.preparation_method,
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
            position=position,
            ingredient=ingredient,
            risk=probabilities[name],
        )
        for name, (position, ingredient) in request.targets.items()
        if probabilities[name] >= threshold
    ]
