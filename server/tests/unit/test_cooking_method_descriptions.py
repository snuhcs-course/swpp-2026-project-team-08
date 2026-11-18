# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 조리 방법 설명 사전이 모든 코드를 덮고 출력 스키마에 실리는지 검증 추가

"""조리 방법 코드가 프롬프트와 출력 스키마에서 설명으로 풀리는지 검증한다."""

from app.features.suggestions.workflow.cooking_methods import (
    COOKING_METHOD_DESCRIPTIONS,
    cooking_method_choices,
    describe_cooking_method,
)
from app.features.suggestions.workflow.schemas import SuggestionDraft
from app.models.meal_enums import MealCookingMethod


def test_every_cooking_method_has_a_description() -> None:
    assert set(COOKING_METHOD_DESCRIPTIONS) == set(MealCookingMethod)


def test_describe_cooking_method_turns_a_code_into_its_description() -> None:
    assert describe_cooking_method("STEAMED") == "찌기"
    assert describe_cooking_method("PAN_FRIED") == "팬에 지지거나 부치기"


def test_describe_cooking_method_leaves_an_unknown_code_unchanged() -> None:
    assert describe_cooking_method("SOMETHING_NEW") == "SOMETHING_NEW"


def test_output_schema_explains_each_cooking_method_choice() -> None:
    description = SuggestionDraft.model_json_schema()["properties"]["cooking_method"]["description"]

    assert description.endswith(f"{cooking_method_choices()}.")
    assert "STEAMED(찌기)" in description
    assert "BAKED_ROASTED(오븐이나 불에 굽기)" in description
