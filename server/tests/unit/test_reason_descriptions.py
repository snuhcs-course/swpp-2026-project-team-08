# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 어려워한 이유 설명 사전이 모든 코드를 덮는지 검증 추가

"""어려워한 이유 코드가 프롬프트에서 설명으로 바뀌는지 검증한다."""

from app.features.suggestions.workflow.reasons import REASON_DESCRIPTIONS, describe_reason
from app.models.difficulty_enums import DifficultyReason


def test_every_difficulty_reason_has_a_description() -> None:
    assert set(REASON_DESCRIPTIONS) == set(DifficultyReason)


def test_descriptions_are_sentences_not_codes() -> None:
    for reason, text in REASON_DESCRIPTIONS.items():
        assert text.strip(), reason
        assert reason.value not in text, reason
        assert not text.isascii(), reason


def test_descriptions_are_distinct() -> None:
    assert len(set(REASON_DESCRIPTIONS.values())) == len(REASON_DESCRIPTIONS)


def test_describe_reason_turns_a_code_into_its_description() -> None:
    assert describe_reason("SMELL.FRUIT") == "과일 향이 나서"
    assert describe_reason("TASTE.SOUR") == "맛이 셔서"
    assert describe_reason("TEXTURE.HARDNESS.HARD") == "식감이 딱딱하고 단단해서"


def test_describe_reason_leaves_an_unknown_code_unchanged() -> None:
    assert describe_reason("SOMETHING.NEW") == "SOMETHING.NEW"
