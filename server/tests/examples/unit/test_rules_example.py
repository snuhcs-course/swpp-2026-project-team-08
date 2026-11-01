# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

from copy import deepcopy

import pytest

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow.state import FoodInput
from tests.helpers.suggestions import batch


@pytest.mark.parametrize("field", ["what_to_try", "why_this_may_help", "serving_tip"])
@pytest.mark.parametrize(
    ("tip", "expected"),
    [
        pytest.param("작게 잘라 제공", [], id="정상_문구"),
        pytest.param("", ["blank_field"], id="빈_문자열"),
        pytest.param("   ", ["blank_field"], id="공백만"),
        pytest.param("\t\n", ["blank_field"], id="탭과_줄바꿈만"),
    ],
)
def test_추천_문구는_공백만으로_구성할_수_없다(field, tip, expected):
    # 준비: 기존 추천 데이터 factory를 재사용하고 검사할 필드만 바꾼다.
    draft = batch("1")
    setattr(draft.suggestions[0], field, tip)
    results = draft.to_generated()
    foods = [FoodInput(id="1", name="밥")]

    # 실행: 순수 검증 함수에는 mock이 필요하지 않다.
    problems = find_problems(foods, results, ChildRestrictions())

    # 검증
    assert [problem.kind for problem in problems] == expected
    if expected:
        assert problems[0].food_id == "1"
        assert problems[0].field == field


@pytest.mark.parametrize(
    ("result_ids", "expected"),
    [
        pytest.param(["1", "2"], [], id="정상_대응"),
        pytest.param(["2", "1"], [], id="순서가_달라도_허용"),
        pytest.param([], [("missing_food", "1"), ("missing_food", "2")], id="전체_누락"),
        pytest.param(["1"], [("missing_food", "2")], id="일부_누락"),
        pytest.param(["1", "2", "3"], [("unexpected_food", "3")], id="요청하지_않은_음식"),
        pytest.param(["1", "1", "2"], [("duplicate_food", "1")], id="중복_결과"),
    ],
)
def test_요청한_음식마다_정확히_하나의_추천이_필요하다(result_ids, expected):
    foods = [FoodInput(id="1", name="밥"), FoodInput(id="2", name="당근")]
    results = batch(*result_ids).to_generated()
    before = deepcopy(results)

    problems = find_problems(foods, results, ChildRestrictions())

    assert [(item.kind, item.food_id) for item in problems] == expected
    assert results == before


@pytest.mark.parametrize(
    ("ingredients", "expected"),
    [
        pytest.param(["rice"], [], id="허용_재료"),
        pytest.param([], ["empty_ingredients"], id="재료_없음"),
        pytest.param([" "], ["empty_ingredients"], id="공백_재료만"),
        pytest.param(["없는재료"], ["unknown_ingredient"], id="카탈로그에_없음"),
        pytest.param(["땅콩버터"], ["restricted_ingredient"], id="제한_재료"),
        pytest.param(
            ["없는재료", "땅콩버터"],
            ["unknown_ingredient", "restricted_ingredient"],
            id="문제_모두_반환",
        ),
    ],
)
def test_추천_재료의_누락과_제한을_각각_검증한다(ingredients, expected):
    draft = batch("1")
    draft.suggestions[0].used_ingredients = ingredients
    restrictions = ChildRestrictions(ids=frozenset({RestrictionId.PEANUT}))

    problems = find_problems([FoodInput(id="1", name="밥")], draft.to_generated(), restrictions)

    assert [item.kind for item in problems] == expected
    for problem in problems:
        assert problem.food_id == "1"
        if problem.kind == "restricted_ingredient":
            assert problem.ingredient == "땅콩버터"
            assert problem.restrictions == ("peanut",)
