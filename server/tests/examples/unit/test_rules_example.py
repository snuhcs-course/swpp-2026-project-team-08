# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: 최신 main 동작에 맞춘 테스트 작성 예시
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 음식 추천 개수·이력·제공 방법 기준의 검증 예시로 변경

from copy import deepcopy

import pytest

from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow.state import PastRecommendation
from tests.helpers.suggestions import batch

CATALOG = build_catalog(["Rice"])


@pytest.mark.parametrize("field", ["what_to_try", "why_this_may_help", "preparation_method"])
@pytest.mark.parametrize(
    ("text", "expected"),
    [
        pytest.param("작게 잘라 제공", [], id="정상_문구"),
        pytest.param("", ["blank_field"], id="빈_문자열"),
        pytest.param("   ", ["blank_field"], id="공백만"),
        pytest.param("\t\n", ["blank_field"], id="탭과_줄바꿈만"),
    ],
)
def test_추천_문구는_공백만으로_구성할_수_없다(field, text, expected):
    # 준비: 기존 추천 데이터 factory를 재사용하고 검사할 필드만 바꾼다.
    draft = batch("Rice porridge")
    setattr(draft.suggestions[0], field, text)
    results = draft.to_generated()

    # 실행: 순수 검증 함수에는 mock이 필요하지 않다.
    problems = find_problems(results, count=1, history=(), catalog=CATALOG)

    # 검증
    assert [problem.kind for problem in problems] == expected
    if expected:
        assert problems[0].position == 0
        assert problems[0].field == field


@pytest.mark.parametrize(
    ("names", "history", "expected"),
    [
        pytest.param(["Rice porridge", "Rice ball"], [], [], id="정상_추천"),
        pytest.param(["Rice porridge"], [], [("wrong_count", None)], id="개수_부족"),
        pytest.param(
            ["Rice porridge", "rice  PORRIDGE"], [], [("duplicate_food", 1)], id="같은_응답_중복"
        ),
        pytest.param(
            ["Rice porridge", "Rice ball"],
            [PastRecommendation("Rice ball", "DISMISSED", ("DISLIKE",))],
            [("repeated_food", 1)],
            id="지난_추천_반복",
        ),
    ],
)
def test_요청한_개수만큼_서로_다른_새_음식을_추천해야_한다(names, history, expected):
    results = batch(*names).to_generated()
    before = deepcopy(results)

    problems = find_problems(results, count=2, history=history, catalog=CATALOG)

    assert [(item.kind, item.position) for item in problems] == expected
    assert results == before


@pytest.mark.parametrize(
    ("ingredients", "expected"),
    [
        pytest.param(["Rice"], [], id="허용_재료"),
        pytest.param([], ["empty_ingredients"], id="재료_없음"),
        pytest.param([" "], ["empty_ingredients"], id="공백_재료만"),
        pytest.param(["없는재료"], ["unavailable_ingredient"], id="카탈로그에_없음"),
        pytest.param(["Peanut butter"], ["unavailable_ingredient"], id="제한_재료"),
        pytest.param(
            ["없는재료", "Peanut butter"],
            ["unavailable_ingredient", "unavailable_ingredient"],
            id="문제_모두_반환",
        ),
    ],
)
def test_추천_재료의_누락과_제한을_각각_검증한다(ingredients, expected):
    draft = batch("Rice porridge")
    draft.suggestions[0].ingredients = ingredients

    problems = find_problems(draft.to_generated(), count=1, history=(), catalog=CATALOG)

    assert [item.kind for item in problems] == expected
    for problem in problems:
        assert problem.position == 0
        if problem.kind == "unavailable_ingredient":
            assert problem.ingredient in ingredients
