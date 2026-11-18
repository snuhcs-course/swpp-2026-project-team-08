# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 노드의 판정, 재시도, 실패 처리 검증 추가

"""가드레일 노드 테스트. 가짜 모델과 가짜 판정기로 그래프 전체를 실행하고 API는 호출하지 않는다."""

import pytest

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.jev import JevError
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.features.suggestions.workflow.state import FoodInput
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.fake_judge import ScriptedJudge

FOODS = [FoodInput(id="f1", name="Broccoli"), FoodInput(id="f2", name="Egg")]
CATALOG = build_catalog(["당근", "쌀", "땅콩버터"])
RESTRICTIONS = ("땅콩 알러지", "채식: 유제품을 먹지 않음")


def drafts(first: list[str], second: list[str], *, tip: str = "Serve it separately."):
    return SuggestionsDraft(
        suggestions=[
            SuggestionDraft(
                food_id=food.id,
                what_to_try="Offer a small piece.",
                why_this_may_help="Familiar pieces build trust.",
                serving_tip=tip,
                ingredients=items,
                cooking_method="STEAMED",
                causes="The texture was hard.",
            )
            for food, items in zip(FOODS, (first, second), strict=True)
        ]
    )


def safe() -> SuggestionsDraft:
    return drafts(["당근"], ["쌀"])


async def run(llm: ScriptedChatModel, judge: ScriptedJudge, **options):
    options.setdefault("restrictions", RESTRICTIONS)
    return await generate_suggestions(FOODS, CATALOG, llm=llm, judge=judge, **options)


async def test_a_safe_result_passes_after_one_judgement() -> None:
    llm, judge = ScriptedChatModel(drafts=[safe()]), ScriptedJudge()

    results = await run(llm, judge)

    assert [r.food_id for r in results] == ["f1", "f2"]
    assert len(llm.compose_inputs) == 1
    assert len(judge.calls) == 1
    state, questions = judge.calls[0]
    assert state["child_restrictions"] == list(RESTRICTIONS)
    assert [s["food_id"] for s in state["suggestions"]] == ["f1", "f2"]
    assert set(questions) == {
        "foodf1_text",
        "foodf1_ingredient0",
        "foodf2_text",
        "foodf2_ingredient0",
    }


async def test_a_risky_ingredient_is_rewritten_with_feedback_naming_it() -> None:
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["쌀"]), safe()])
    judge = ScriptedJudge.flagging("'땅콩버터'")

    results = await run(llm, judge)

    assert results[0].ingredients == ("당근",)
    assert len(llm.compose_inputs) == 2
    assert len(judge.calls) == 2
    feedback = llm.compose_inputs[1][-1].content
    assert "food_id f1" in feedback and "땅콩버터" in feedback
    assert "식이 제한에 어긋날 가능성이 높다고 판정" in feedback
    # 문제가 없는 음식은 피드백에 나오지 않는다.
    assert "food_id f2" not in feedback


async def test_a_risky_text_is_rewritten_with_feedback_about_the_sentences() -> None:
    llm = ScriptedChatModel(drafts=[drafts(["당근"], ["쌀"], tip="Add some cheese."), safe()])
    judge = ScriptedJudge(
        lambda state, name, question: (
            0.9
            if name == "foodf1_text" and "cheese" in str(state["suggestions"][0]["serving_tip"])
            else 0.0
        )
    )

    await run(llm, judge)

    feedback = llm.compose_inputs[1][-1].content
    assert "food_id f1의 제안 문장" in feedback
    assert "먹을 수 없는 재료나 음식이 들어 있을 가능성이 높다고 판정" in feedback


async def test_a_retry_sees_its_earlier_drafts_and_all_feedback_so_far() -> None:
    first, second = drafts(["땅콩버터"], ["쌀"]), drafts(["땅콩버터"], ["당근"])
    llm = ScriptedChatModel(drafts=[first, second, safe()])
    judge = ScriptedJudge.flagging("'땅콩버터'")

    await run(llm, judge)

    third_input = llm.compose_inputs[2]
    kinds = [type(message).__name__ for message in third_input]
    # 시스템, 사용자, 작성 지시, (초안, 피드백) x 2
    assert kinds == ["SystemMessage", "HumanMessage", "HumanMessage"] + [
        "AIMessage",
        "HumanMessage",
        "AIMessage",
        "HumanMessage",
    ]
    assert third_input[3].content == first.model_dump_json()
    assert third_input[5].content == second.model_dump_json()
    assert "땅콩버터" in third_input[4].content and "땅콩버터" in third_input[6].content
    # 첫 대화(재료 목록 포함)는 시도마다 반복해서 쌓이지 않는다.
    assert sum("쓸 수 있는 재료" in str(message.content) for message in third_input) == 2


async def test_rejected_when_the_risk_stays_after_all_attempts() -> None:
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["쌀"])] * MAX_ATTEMPTS)
    judge = ScriptedJudge.flagging("'땅콩버터'", probability=0.97)

    with pytest.raises(GenerationRejectedError) as raised:
        await run(llm, judge)

    assert len(llm.compose_inputs) == MAX_ATTEMPTS
    assert len(judge.calls) == MAX_ATTEMPTS
    assert [(p.kind, p.food_id, p.ingredient, p.risk) for p in raised.value.problems] == [
        ("restriction_risk", "f1", "땅콩버터", 0.97)
    ]


async def test_the_threshold_decides_what_counts_as_risky() -> None:
    judge = ScriptedJudge(lambda state, name, question: 0.4)

    with pytest.raises(GenerationRejectedError):
        await run(ScriptedChatModel(drafts=[safe()] * MAX_ATTEMPTS), judge, risk_threshold=0.4)

    results = await run(ScriptedChatModel(drafts=[safe()]), judge, risk_threshold=0.5)
    assert len(results) == 2


async def test_no_judgement_when_the_child_has_no_restrictions() -> None:
    llm, judge = ScriptedChatModel(drafts=[safe()]), ScriptedJudge.flagging("당근")

    results = await run(llm, judge, restrictions=())

    assert len(results) == 2
    assert judge.calls == []


async def test_the_judge_is_not_asked_while_deterministic_validation_fails() -> None:
    llm = ScriptedChatModel(drafts=[drafts(["목록에 없는 재료"], ["쌀"]), safe()])
    judge = ScriptedJudge()

    await run(llm, judge)

    assert len(llm.compose_inputs) == 2
    assert len(judge.calls) == 1


async def test_a_failing_judgement_ends_without_a_suggestion() -> None:
    llm = ScriptedChatModel(drafts=[safe()])
    judge = ScriptedJudge(error=JevError("Jev 응답 오류: HTTP 500"))

    with pytest.raises(JevError):
        await run(llm, judge)

    assert len(llm.compose_inputs) == 1
