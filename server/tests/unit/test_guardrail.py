# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 질문 생성과 위험 판정 해석 검증 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 질문 대상을 추천 순서로, 판정 값에 제공 방법을 싣도록 변경

"""가드레일의 순수 함수 테스트. 판정 모델은 호출하지 않는다."""

import pytest

from app.features.suggestions.workflow.guardrail import build_request, find_risks
from app.features.suggestions.workflow.restrictions import (
    RESTRICTION_DESCRIPTIONS,
    describe_restrictions,
)
from app.features.suggestions.workflow.state import GeneratedSuggestion
from app.models.restriction_enums import RestrictionType


def suggestion(ingredients: tuple[str, ...], **fields) -> GeneratedSuggestion:
    values = {
        "what_to_try": "Rice porridge",
        "why_this_may_help": "It is close to the rice the child already eats.",
        "preparation_method": "Serve a small, soft portion.",
        **fields,
    }
    return GeneratedSuggestion(ingredients=ingredients, **values)


def test_every_restriction_except_none_has_a_description() -> None:
    assert set(RESTRICTION_DESCRIPTIONS) == set(RestrictionType) - {RestrictionType.ALLERGY_NONE}


def test_descriptions_are_readable_not_codes() -> None:
    for kind, text in RESTRICTION_DESCRIPTIONS.items():
        assert not text.isascii(), kind
        assert kind.value not in text, kind


def test_describe_restrictions_skips_none_and_follows_code_order() -> None:
    types = {
        RestrictionType.ALLERGY_NONE,
        RestrictionType.ALLERGY_PEANUTS,
        RestrictionType.ALLERGY_EGGS,
    }

    assert describe_restrictions(types) == ("달걀 알러지", "땅콩 알러지")
    assert describe_restrictions([]) == ()


def test_request_has_a_text_question_and_one_question_per_ingredient() -> None:
    request = build_request(("땅콩 알러지",), [suggestion(("쌀", "당근")), suggestion(("감자",))])

    assert set(request.questions) == {
        "suggestion0_text",
        "suggestion0_ingredient0",
        "suggestion0_ingredient1",
        "suggestion1_text",
        "suggestion1_ingredient0",
    }
    assert request.targets == {
        "suggestion0_text": (0, None),
        "suggestion0_ingredient0": (0, "쌀"),
        "suggestion0_ingredient1": (0, "당근"),
        "suggestion1_text": (1, None),
        "suggestion1_ingredient0": (1, "감자"),
    }
    assert "'당근'" in request.questions["suggestion0_ingredient1"]
    assert "suggestions[1]" in request.questions["suggestion1_text"]
    assert "preparation_method" in request.questions["suggestion1_text"]


def test_request_state_carries_the_restrictions_and_the_whole_suggestion() -> None:
    request = build_request(("땅콩 알러지", "채식: 유제품을 먹지 않음"), [suggestion(("쌀",))])

    assert request.state == {
        "child_restrictions": ["땅콩 알러지", "채식: 유제품을 먹지 않음"],
        "suggestions": [
            {
                "what_to_try": "Rice porridge",
                "why_this_may_help": "It is close to the rice the child already eats.",
                "ingredients": ["쌀"],
                "preparation_method": "Serve a small, soft portion.",
            }
        ],
    }


def test_risks_are_found_at_or_above_the_threshold() -> None:
    request = build_request(("x",), [suggestion(("쌀", "땅콩버터"))])
    probabilities = {
        "suggestion0_text": 0.05,
        "suggestion0_ingredient0": 0.29,
        "suggestion0_ingredient1": 0.3,
    }

    problems = find_risks(request, probabilities, 0.3)

    assert [(p.kind, p.position, p.ingredient, p.risk) for p in problems] == [
        ("restriction_risk", 0, "땅콩버터", 0.3)
    ]


def test_a_risky_text_is_reported_without_an_ingredient() -> None:
    request = build_request(("x",), [suggestion(("쌀",))])

    problems = find_risks(request, {"suggestion0_text": 0.93, "suggestion0_ingredient0": 0.0}, 0.3)

    assert [(p.position, p.ingredient, p.risk) for p in problems] == [(0, None, 0.93)]


def test_no_problem_when_everything_is_below_the_threshold() -> None:
    request = build_request(("x",), [suggestion(("쌀",))])

    assert find_risks(request, {"suggestion0_text": 0.0, "suggestion0_ingredient0": 0.1}, 0.3) == []


def test_a_missing_answer_is_not_treated_as_safe() -> None:
    request = build_request(("x",), [suggestion(("쌀",))])

    with pytest.raises(KeyError):
        find_risks(request, {"suggestion0_text": 0.0}, 0.3)
