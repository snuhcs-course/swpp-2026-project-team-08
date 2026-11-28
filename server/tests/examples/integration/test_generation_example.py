# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: 최신 main 동작에 맞춘 테스트 작성 예시
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 재료 목록 구분자 변경 반영
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 연령대와 추천 개수를 넘기는 음식 추천 생성 예시로 변경

import pytest
from langchain_core.messages import HumanMessage

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.suggestions import batch, install_model

CATALOG = build_catalog(["Rice"])


async def generate(**options):
    """추천 하나를 요청한다. 연령대와 쓸 수 있는 재료만 있어도 추천할 수 있다."""
    return await generate_suggestions(count=1, age_group="AGE_4_5", catalog=CATALOG, **options)


# 실제 그래프·검증·재시도를 연결한다. install_model은 LLM 생성만 대체한다.
async def test_유효한_추천은_재시도_없이_반환한다(monkeypatch):
    # 준비: 공통 factory로 응답을 만들고 외부 모델만 설치한다.
    model = install_model(monkeypatch, [batch("Rice porridge")])

    # 실행
    results = await generate()

    # 검증
    assert [item.what_to_try for item in results] == ["Rice porridge"]
    assert results[0].ingredients == ("Rice",)
    assert len(model.compose_inputs) == 1


@pytest.mark.parametrize(
    "failures", [1, MAX_ATTEMPTS - 1], ids=["한번_실패_후_성공", "마지막_기회에_성공"]
)
async def test_잘못된_추천은_피드백을_전달하고_다시_생성한다(monkeypatch, failures):
    # 준비: 지정한 횟수만큼 필수 문구가 빈 응답을 주고 마지막에는 정상 응답을 준다.
    invalid = batch("Rice porridge")
    invalid.suggestions[0].preparation_method = ""
    model = install_model(
        monkeypatch,
        [invalid.model_copy(deep=True) for _ in range(failures)] + [batch("Rice porridge")],
    )

    # 실행
    results = await generate()

    # 검증: 결과와 실제 모델에 보낸 재시도 피드백을 확인한다.
    assert results[0].preparation_method
    assert len(model.compose_inputs) == failures + 1
    feedback = model.compose_inputs[1][-1]
    assert isinstance(feedback, HumanMessage)
    assert "preparation_method" in feedback.content


async def test_재시도를_소진하면_잘못된_추천을_반환하지_않는다(monkeypatch):
    # 준비: 각 응답은 독립된 객체로 만든다.
    drafts = [batch("Rice porridge") for _ in range(MAX_ATTEMPTS)]
    for draft in drafts:
        draft.suggestions[0].preparation_method = ""
    model = install_model(monkeypatch, drafts)

    # 실행
    with pytest.raises(GenerationRejectedError) as raised:
        await generate()

    # 검증: 이 그래프는 저장을 담당하지 않으므로 오류와 호출 상한을 검사한다.
    assert len(model.compose_inputs) == MAX_ATTEMPTS
    assert [(item.kind, item.position, item.field) for item in raised.value.problems] == [
        ("blank_field", 0, "preparation_method")
    ]


async def test_사용_가능한_재료_목록을_모델에_전달한다():
    # 그래프는 도구 호출 대신 사용 가능한 재료 목록을 프롬프트 마지막에 넣는다.
    model = ScriptedChatModel(drafts=[batch("Rice porridge")])

    results = await generate(llm=model)

    prompt = next(m.content for m in model.compose_inputs[0] if isinstance(m, HumanMessage))
    assert prompt.endswith("이름 안의 쉼표는 이름의 일부):\nRice")
    assert results[0].ingredients == ("Rice",)
