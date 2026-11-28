# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 추천 상태·거절 이유 설명 사전이 모든 코드를 덮는지 검증 추가

"""추천 상태와 거절 이유 코드가 프롬프트에서 문장으로 바뀌는지 검증한다."""

from app.features.suggestions.workflow.decisions import (
    DISMISS_REASON_DESCRIPTIONS,
    STATUS_DESCRIPTIONS,
    describe_dismiss_reason,
    describe_status,
)
from app.models.food_recommendation_enums import (
    FoodRecommendationDismissReason,
    FoodRecommendationStatus,
)


def test_every_status_and_dismiss_reason_has_a_description() -> None:
    assert set(STATUS_DESCRIPTIONS) == set(FoodRecommendationStatus)
    assert set(DISMISS_REASON_DESCRIPTIONS) == set(FoodRecommendationDismissReason)


def test_descriptions_are_sentences_not_codes() -> None:
    for code, text in {**STATUS_DESCRIPTIONS, **DISMISS_REASON_DESCRIPTIONS}.items():
        assert not text.isascii(), code
        assert code.value not in text, code


def test_describe_turns_a_code_into_its_description() -> None:
    assert describe_status("DISMISSED") == "보호자가 거절했다"
    assert describe_dismiss_reason("TOO_MUCH_PREPARATION") == "준비가 너무 번거로워서"


def test_describe_leaves_an_unknown_code_unchanged() -> None:
    assert describe_status("SOMETHING_NEW") == "SOMETHING_NEW"
    assert describe_dismiss_reason("SOMETHING_NEW") == "SOMETHING_NEW"
