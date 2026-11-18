# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 질문 생성과 위험 판정 해석 검증 추가

"""가드레일의 순수 함수 테스트. 판정 모델은 호출하지 않는다."""

import pytest

from app.features.suggestions.workflow.guardrail import build_request, find_risks
from app.features.suggestions.workflow.restrictions import (
    RESTRICTION_DESCRIPTIONS,
    describe_restrictions,
)
from app.features.suggestions.workflow.state import GeneratedSuggestion
from app.models.meal_enums import MealCookingMethod
from app.models.restriction_enums import RestrictionType


def suggestion(food_id: str, ingredients: tuple[str, ...], **fields) -> GeneratedSuggestion:
    values = {
        "what_to_try": "Offer a small piece.",
        "why_this_may_help": "Familiar pieces build trust.",
        "serving_tip": "Serve it separately.",
        "cooking_method": MealCookingMethod.STEAMED,
        "causes": "The texture was hard.",
        **fields,
    }
    return GeneratedSuggestion(food_id=food_id, ingredients=ingredients, **values)


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
    request = build_request(
        ("땅콩 알러지",), [suggestion("0", ("쌀", "당근")), suggestion("1", ("감자",))]
    )

    assert set(request.questions) == {
        "food0_text",
        "food0_ingredient0",
        "food0_ingredient1",
        "food1_text",
        "food1_ingredient0",
    }
    assert request.targets == {
        "food0_text": ("0", None),
        "food0_ingredient0": ("0", "쌀"),
        "food0_ingredient1": ("0", "당근"),
        "food1_text": ("1", None),
        "food1_ingredient0": ("1", "감자"),
    }
    assert "'당근'" in request.questions["food0_ingredient1"]
    assert "food_id 1" in request.questions["food1_text"]


def test_request_state_carries_the_restrictions_and_the_whole_suggestion() -> None:
    request = build_request(("땅콩 알러지", "채식: 유제품을 먹지 않음"), [suggestion("0", ("쌀",))])

    assert request.state == {
        "child_restrictions": ["땅콩 알러지", "채식: 유제품을 먹지 않음"],
        "suggestions": [
            {
                "food_id": "0",
                "what_to_try": "Offer a small piece.",
                "why_this_may_help": "Familiar pieces build trust.",
                "serving_tip": "Serve it separately.",
                "ingredients": ["쌀"],
                "cooking_method": "STEAMED",
            }
        ],
    }


def test_risks_are_found_at_or_above_the_threshold() -> None:
    request = build_request(("x",), [suggestion("0", ("쌀", "땅콩버터"))])
    probabilities = {"food0_text": 0.05, "food0_ingredient0": 0.29, "food0_ingredient1": 0.3}

    problems = find_risks(request, probabilities, 0.3)

    assert [(p.kind, p.food_id, p.ingredient, p.risk) for p in problems] == [
        ("restriction_risk", "0", "땅콩버터", 0.3)
    ]


def test_a_risky_text_is_reported_without_an_ingredient() -> None:
    request = build_request(("x",), [suggestion("0", ("쌀",))])

    problems = find_risks(request, {"food0_text": 0.93, "food0_ingredient0": 0.0}, 0.3)

    assert [(p.food_id, p.ingredient, p.risk) for p in problems] == [("0", None, 0.93)]


def test_no_problem_when_everything_is_below_the_threshold() -> None:
    request = build_request(("x",), [suggestion("0", ("쌀",))])

    assert find_risks(request, {"food0_text": 0.0, "food0_ingredient0": 0.1}, 0.3) == []


def test_a_missing_answer_is_not_treated_as_safe() -> None:
    request = build_request(("x",), [suggestion("0", ("쌀",))])

    with pytest.raises(KeyError):
        find_risks(request, {"food0_text": 0.0}, 0.3)
