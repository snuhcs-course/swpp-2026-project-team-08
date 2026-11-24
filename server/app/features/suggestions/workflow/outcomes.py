# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 식후 먹은 정도(outcome) 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가

"""식후 먹은 정도(`EatingOutcome`) 코드의 프롬프트용 설명.

LLM 에는 코드(`UNTOUCHED`) 대신 "~했다" 로 끝나는 문장을 보낸다.
모든 `EatingOutcome` 에 설명이 있어야 하며 테스트가 이를 확인한다.
"""

from app.models.meal_enums import EatingOutcome

OUTCOME_DESCRIPTIONS: dict[EatingOutcome, str] = {
    EatingOutcome.EATEN: "잘 먹었다",
    EatingOutcome.TASTED: "맛만 보고 더 먹지 않았다",
    EatingOutcome.UNTOUCHED: "입에 대지 않았다",
    EatingOutcome.UNCLEAR: "얼마나 먹었는지 확인하지 못했다",
}


def describe_outcome(code: str) -> str:
    """먹은 정도 코드를 문장으로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return OUTCOME_DESCRIPTIONS[EatingOutcome(code)]
    except (ValueError, KeyError):
        return code
