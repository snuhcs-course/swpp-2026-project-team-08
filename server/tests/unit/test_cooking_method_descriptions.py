# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 조리 방법 설명 사전이 모든 코드를 덮고 출력 스키마에 실리는지 검증 추가
# AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
# Changed: 기존 기록 설명과 새 추천 조리법 열 가지 선택지 검증

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
    assert describe_cooking_method("BAKED") == "오븐에서 굽기(베이킹)"
    assert describe_cooking_method("ROASTED") == "불이나 오븐에서 로스팅하기"
    assert describe_cooking_method("MASHED") == "으깨기"
    assert describe_cooking_method("BLENDED") == "곱게 갈기"
    assert describe_cooking_method("BAKED_ROASTED") == "오븐이나 불에 굽기"
    assert describe_cooking_method("MASHED_BLENDED") == "으깨거나 갈기"


def test_describe_cooking_method_leaves_an_unknown_code_unchanged() -> None:
    assert describe_cooking_method("SOMETHING_NEW") == "SOMETHING_NEW"


def test_output_schema_explains_each_cooking_method_choice() -> None:
    expected = {
        "RAW": "익히지 않고 날것으로",
        "BOILED": "삶거나 끓이기",
        "STEAMED": "찌기",
        "PAN_FRIED": "팬에 지지거나 부치기",
        "STIR_FRIED": "기름에 볶기",
        "BAKED": "오븐에서 굽기(베이킹)",
        "ROASTED": "불이나 오븐에서 로스팅하기",
        "MASHED": "으깨기",
        "BLENDED": "곱게 갈기",
        "OTHER": "그 밖의 조리 방법",
    }
    choices = ", ".join(f"{code}({text})" for code, text in expected.items())
    schema = SuggestionDraft.model_json_schema()["properties"]["cooking_method"]

    assert cooking_method_choices() == choices
    assert schema["enum"] == list(expected)
    assert schema["description"].endswith(f"{choices}.")
