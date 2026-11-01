# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 실제 추천 그래프와 가짜 LLM Integration 예시

import pytest
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.state import FoodInput
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.suggestions import batch, install_model


# 실제 그래프·검증·재시도를 연결한다. install_model은 LLM 생성만 대체한다.
async def test_유효한_추천은_재시도_없이_반환한다(monkeypatch):
    # 준비: 공통 factory로 응답을 만들고 외부 모델만 설치한다.
    model = install_model(monkeypatch, [batch("1")])
    foods = [FoodInput(id="1", name="밥")]

    # 실행
    results = await generate_suggestions(foods, ChildRestrictions())

    # 검증
    assert len(results) == 1
    assert results[0].food_id == "1"
    assert results[0].used_ingredients == ("rice",)
    assert len(model.compose_inputs) == 1


@pytest.mark.parametrize(
    "failures", [1, MAX_ATTEMPTS - 1], ids=["한번_실패_후_성공", "마지막_기회에_성공"]
)
async def test_잘못된_추천은_피드백을_전달하고_다시_생성한다(monkeypatch, failures):
    # 준비: 지정한 횟수만큼 필수 문구가 빈 응답을 주고 마지막에는 정상 응답을 준다.
    invalid = batch("1")
    invalid.suggestions[0].serving_tip = ""
    model = install_model(
        monkeypatch, [invalid.model_copy(deep=True) for _ in range(failures)] + [batch("1")]
    )

    # 실행
    results = await generate_suggestions([FoodInput(id="1", name="밥")], ChildRestrictions())

    # 검증: 결과와 실제 모델에 보낸 재시도 피드백을 확인한다.
    assert results[0].serving_tip == "작게 잘라 제공"
    assert len(model.compose_inputs) == failures + 1
    feedback = model.compose_inputs[1][-1]
    assert isinstance(feedback, HumanMessage)
    assert "serving_tip" in feedback.content


async def test_재시도를_소진하면_잘못된_추천을_반환하지_않는다(monkeypatch):
    # 준비: 각 응답은 독립된 객체로 만든다.
    drafts = [batch("1") for _ in range(MAX_ATTEMPTS)]
    for draft in drafts:
        draft.suggestions[0].serving_tip = ""
    model = install_model(monkeypatch, drafts)

    # 실행
    with pytest.raises(GenerationRejectedError) as raised:
        await generate_suggestions([FoodInput(id="1", name="밥")], ChildRestrictions())

    # 검증: 이 그래프는 저장을 담당하지 않으므로 오류와 호출 상한을 검사한다.
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert [(item.kind, item.food_id, item.field) for item in raised.value.problems] == [
        ("blank_field", "1", "serving_tip")
    ]


async def test_도구가_제한_재료를_제외한_결과를_모델에_전달한다():
    # 실제 도구 노드를 거치도록 가짜 모델에 도구 호출 메시지를 제공한다.
    model = ScriptedChatModel(
        replies=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "search_available_ingredients",
                        "args": {"candidates": ["땅콩버터", "rice"]},
                        "id": "example-call",
                    }
                ],
            ),
            AIMessage(content="확인 완료"),
        ],
        drafts=[batch("1")],
    )
    restrictions = ChildRestrictions(ids=frozenset({RestrictionId.PEANUT}))

    results = await generate_suggestions([FoodInput(id="1", name="밥")], restrictions, llm=model)

    tool_results = [
        message for message in model.compose_inputs[0] if isinstance(message, ToolMessage)
    ]
    assert len(tool_results) == 1
    assert tool_results[0].tool_call_id == "example-call"
    assert tool_results[0].content == '["rice"]'
    assert results[0].used_ingredients == ("rice",)
