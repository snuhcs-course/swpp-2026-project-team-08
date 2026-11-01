# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

import pytest
from pydantic import ValidationError

from app.features.meals.dto import FoodWriteRequest, IngredientInput, MealWriteRequest


@pytest.mark.parametrize(
    ("acceptance", "valid"),
    [
        pytest.param(None, True, id="선택값_없음"),
        pytest.param(0, True, id="최솟값"),
        pytest.param(1, True, id="중간값"),
        pytest.param(3, True, id="최댓값"),
        pytest.param(-1, False, id="최솟값_미만"),
        pytest.param(4, False, id="최댓값_초과"),
        pytest.param(1.5, False, id="소수"),
        pytest.param(True, False, id="boolean"),
        pytest.param("1", False, id="숫자_문자열"),
    ],
)
def test_음식_수용도는_정해진_정수_범위만_허용한다(acceptance, valid):
    # 준비: 짧고 이 테스트에만 필요한 입력은 본문에 둔다.
    payload = {"id": "1", "name": "밥", "ingredients": [], "acceptance": acceptance}

    # 실행·검증
    if valid:
        assert FoodWriteRequest(**payload).acceptance == acceptance
    else:
        with pytest.raises(ValidationError) as raised:
            FoodWriteRequest(**payload)
        assert raised.value.errors()[0]["loc"] == ("acceptance",)


# 한 필드만 변경해 실패 원인이 무엇인지 알 수 있게 한다.
@pytest.mark.parametrize(
    ("food_id", "valid"),
    [
        pytest.param("1", True, id="최소_ID"),
        pytest.param("42", True, id="일반_ID"),
        pytest.param("9223372036854775807", True, id="최대_ID"),
        pytest.param("9223372036854775808", False, id="최대_ID_초과"),
        pytest.param("0", False, id="0"),
        pytest.param("-1", False, id="음수"),
        pytest.param("01", False, id="앞자리_0"),
        pytest.param("1.5", False, id="소수"),
        pytest.param("１", False, id="전각_숫자"),
        pytest.param("", False, id="빈_ID"),
        pytest.param(None, False, id="null"),
        pytest.param(1, False, id="숫자_타입"),
    ],
)
def test_음식_ID는_양의_BIGINT_문자열만_허용한다(food_id, valid):
    payload = {"id": food_id, "name": "밥", "ingredients": []}
    if valid:
        assert FoodWriteRequest(**payload).id == food_id
    else:
        with pytest.raises(ValidationError) as raised:
            FoodWriteRequest(**payload)
        assert raised.value.errors()[0]["loc"] == ("id",)


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        pytest.param("감자", "감자", id="한글"),
        pytest.param("  Brown   Rice  ", "Brown Rice", id="공백_정규화"),
        pytest.param("감자\t볶음", "감자 볶음", id="탭_정규화"),
        pytest.param("", None, id="빈_문자열_거부"),
        pytest.param(" \t\n ", None, id="공백만_거부"),
        pytest.param(None, None, id="null_거부"),
    ],
)
def test_재료명은_공백을_정리하되_빈_값은_거부한다(name, expected):
    if expected is None:
        with pytest.raises(ValidationError) as raised:
            IngredientInput(name=name)
        assert raised.value.errors()[0]["loc"] == ("name",)
    else:
        assert IngredientInput(name=name).name == expected


@pytest.mark.parametrize(
    ("ids", "valid"),
    [
        pytest.param([], False, id="음식_없음"),
        pytest.param(["1"], True, id="단일_음식"),
        pytest.param(["1", "2"], True, id="여러_음식"),
        pytest.param(["1", "1"], False, id="중복_ID"),
    ],
)
def test_식사에는_중복_ID_없는_음식이_하나_이상_필요하다(ids, valid):
    payload = {
        "meal_date": "2026-11-02",
        "meal_type": "lunch",
        "setting": "home",
        "foods": [{"id": value, "name": "밥", "ingredients": []} for value in ids],
    }
    if valid:
        assert [food.id for food in MealWriteRequest(**payload).foods] == ids
    else:
        with pytest.raises(ValidationError) as raised:
            MealWriteRequest(**payload)
        assert raised.value.errors()[0]["loc"] == ("foods",)


@pytest.mark.parametrize("field", ["id", "name", "ingredients"])
def test_필수_음식_필드를_생략하면_해당_필드를_거부한다(field):
    payload = {"id": "1", "name": "밥", "ingredients": []}
    del payload[field]
    with pytest.raises(ValidationError) as raised:
        FoodWriteRequest(**payload)
    assert raised.value.errors()[0]["loc"] == (field,)
    assert raised.value.errors()[0]["type"] == "missing"
