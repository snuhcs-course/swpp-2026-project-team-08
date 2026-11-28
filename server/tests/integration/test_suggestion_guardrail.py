# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 노드의 판정, 재시도, 실패 처리 검증 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 음식 추천 입력과 추천 순서 기준 질문·피드백으로 변경

"""가드레일 노드 테스트. 가짜 모델과 가짜 판정기로 그래프 전체를 실행하고 API는 호출하지 않는다."""

import pytest

from app.features.suggestions.generator import GenerationRejectedError, generate_suggestions
from app.features.suggestions.ingredients import build_catalog
from app.features.suggestions.workflow.jev import JevError
from app.features.suggestions.workflow.nodes import MAX_ATTEMPTS
from app.features.suggestions.workflow.schemas import SuggestionsDraft
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.fake_judge import ScriptedJudge
from tests.helpers.suggestions import suggestion_draft

CATALOG = build_catalog(["당근", "쌀", "땅콩버터"])
RESTRICTIONS = ("땅콩 알러지", "채식: 유제품을 먹지 않음")


def drafts(
    first: list[str], second: list[str], *, preparation: str = "Serve it separately."
) -> SuggestionsDraft:
    return SuggestionsDraft(
        suggestions=[
            suggestion_draft("Carrot mash", ingredients=first, preparation_method=preparation),
            suggestion_draft("Rice porridge", ingredients=second),
        ]
    )


def safe() -> SuggestionsDraft:
    return drafts(["당근"], ["쌀"])


async def run(llm: ScriptedChatModel, judge: ScriptedJudge, **options):
    options.setdefault("restrictions", RESTRICTIONS)
    return await generate_suggestions(
        count=2, age_group="AGE_4_5", catalog=CATALOG, llm=llm, judge=judge, **options
    )


async def test_a_safe_result_passes_after_one_judgement() -> None:
    llm, judge = ScriptedChatModel(drafts=[safe()]), ScriptedJudge()

    results = await run(llm, judge)

    assert [r.what_to_try for r in results] == ["Carrot mash", "Rice porridge"]
    assert len(llm.compose_inputs) == 1
    assert len(judge.calls) == 1
    state, questions = judge.calls[0]
    assert state["child_restrictions"] == list(RESTRICTIONS)
    assert [s["what_to_try"] for s in state["suggestions"]] == ["Carrot mash", "Rice porridge"]
    assert set(questions) == {
        "suggestion0_text",
        "suggestion0_ingredient0",
        "suggestion1_text",
        "suggestion1_ingredient0",
    }


async def test_a_risky_ingredient_is_rewritten_with_feedback_naming_it() -> None:
    llm = ScriptedChatModel(drafts=[drafts(["땅콩버터"], ["쌀"]), safe()])
    judge = ScriptedJudge.flagging("'땅콩버터'")

    results = await run(llm, judge)

    assert results[0].ingredients == ("당근",)
    assert len(llm.compose_inputs) == 2
    assert len(judge.calls) == 2
    feedback = llm.compose_inputs[1][-1].content
    assert "추천 1의 재료 '땅콩버터'" in feedback
    assert "식이 제한에 어긋날 가능성이 높다고 판정" in feedback
    # 문제가 없는 추천은 피드백에 나오지 않는다.
    assert "추천 2" not in feedback


async def test_a_risky_text_is_rewritten_with_feedback_about_the_sentences() -> None:
    llm = ScriptedChatModel(
        drafts=[drafts(["당근"], ["쌀"], preparation="Add some cheese."), safe()]
    )
    judge = ScriptedJudge(
        lambda state, name, question: (
            0.9
            if name == "suggestion0_text"
            and "cheese" in str(state["suggestions"][0]["preparation_method"])
            else 0.0
        )
    )

    await run(llm, judge)

    feedback = llm.compose_inputs[1][-1].content
    assert "추천 1의 문장" in feedback
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
    assert [(p.kind, p.position, p.ingredient, p.risk) for p in raised.value.problems] == [
        ("restriction_risk", 0, "땅콩버터", 0.97)
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
