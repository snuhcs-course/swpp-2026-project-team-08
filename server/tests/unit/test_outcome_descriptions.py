# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 식후 먹은 정도 설명 사전이 모든 코드를 덮는지 검증 추가

"""식후 먹은 정도 코드가 프롬프트에서 문장으로 바뀌는지 검증한다."""

from app.features.suggestions.workflow.outcomes import OUTCOME_DESCRIPTIONS, describe_outcome
from app.models.meal_enums import EatingOutcome


def test_every_eating_outcome_has_a_description() -> None:
    assert set(OUTCOME_DESCRIPTIONS) == set(EatingOutcome)


def test_descriptions_are_sentences_not_codes() -> None:
    for outcome, text in OUTCOME_DESCRIPTIONS.items():
        assert not text.isascii(), outcome
        assert outcome.value not in text, outcome


def test_describe_outcome_turns_a_code_into_its_description() -> None:
    assert describe_outcome("UNTOUCHED") == "입에 대지 않았다"
    assert describe_outcome("EATEN") == "잘 먹었다"


def test_describe_outcome_leaves_an_unknown_code_unchanged() -> None:
    assert describe_outcome("SOMETHING_NEW") == "SOMETHING_NEW"
