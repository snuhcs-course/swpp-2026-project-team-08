# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 판정 모델 평가 세트의 형식·정답 근거와 채점 로직 검증 추가

"""가드레일 판정 모델 평가 세트(`guardrail_judge_ground_truth.json`)의 오프라인 검증.

판정 모델은 호출하지 않는다. 세트가 올바른지, 정답이 실제 재료 데이터와 맞는지, 채점 로직이
좋은 판정기와 나쁜 판정기를 구분하는지만 본다. 실제 평가는 `scripts/evaluate_guardrail.py` 로 한다.

기본 테스트(`testpaths`)에는 포함되지 않는다. server/ 에서 직접 실행한다.

    uv run pytest tests/eval -q -s
"""

from pathlib import Path

from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.ingredients import ChildRestrictions
from app.models.restriction_enums import RestrictionType
from scripts.evaluate_guardrail import (
    evaluate,
    failed_metrics,
    format_report,
    load_json,
    metrics,
)
from scripts.load_ingredients import import_catalog
from tests.helpers.fake_judge import ScriptedJudge

ASSETS = Path(__file__).resolve().parents[2] / "assets"
GROUPS = {
    "core_ingredient",
    "multiple_restrictions",
    "hard_ingredient",
    "prose_risky",
    "safe",
    "safe_negation",
}


def spec_and_limits() -> tuple[dict, dict]:
    return load_json("guardrail_judge_ground_truth.json"), load_json(
        "guardrail_judge_thresholds.json"
    )


def test_the_evaluation_set_is_well_formed() -> None:
    spec, limits = spec_and_limits()
    cases = spec["cases"]
    ids = [case["id"] for case in cases]

    assert len(cases) >= limits["minimum_cases"]
    assert len(set(ids)) == len(ids)
    assert set(spec["_meta"]["groups"]) == GROUPS
    for case in cases:
        assert case["group"] in GROUPS, case["id"]
        assert case["restrictions"], case["id"]
        assert all(RestrictionType(code) for code in case["restrictions"]), case["id"]
        assert set(case["risky_ingredients"]) <= set(case["ingredients"]), case["id"]
        assert len(set(case["ingredients"])) == len(case["ingredients"]), case["id"]


def test_every_group_has_cases_and_the_risk_expectations_match_the_group() -> None:
    spec, _ = spec_and_limits()
    by_group: dict[str, list[dict]] = {}
    for case in spec["cases"]:
        by_group.setdefault(case["group"], []).append(case)

    assert set(by_group) == GROUPS
    for group in ("core_ingredient", "multiple_restrictions", "hard_ingredient"):
        assert all(case["risky_ingredients"] and not case["text_risky"] for case in by_group[group])
    assert all(
        case["text_risky"] and not case["risky_ingredients"] for case in by_group["prose_risky"]
    )
    for group in ("safe", "safe_negation"):
        assert all(
            not case["text_risky"] and not case["risky_ingredients"] for case in by_group[group]
        )


async def test_expected_risks_follow_the_ingredient_catalog(session_factory) -> None:
    """위험 재료는 카탈로그에서 쓸 수 없고, 나머지 재료는 쓸 수 있어야 정답의 근거가 선다."""
    spec, _ = spec_and_limits()

    async with session_factory() as session:
        await import_catalog(
            session, ASSETS / "ingredients.jsonl", ASSETS / "ingredients_restrictions.jsonl"
        )
        await session.commit()
        for case in spec["cases"]:
            restrictions = ChildRestrictions(
                frozenset(RestrictionType(c) for c in case["restrictions"])
            )
            usable = set((await load_catalog(session, restrictions)).names.values())
            risky = set(case["risky_ingredients"])
            assert not (risky & usable), (
                f"{case['id']}: 위험 재료가 쓸 수 있는 재료다 {risky & usable}"
            )
            safe_listed = set(case["ingredients"]) - risky
            assert safe_listed <= usable, f"{case['id']}: 쓸 수 없는 재료 {safe_listed - usable}"


def perfect_judge(spec: dict) -> ScriptedJudge:
    """사례의 기대를 그대로 아는 판정기. 채점 로직 검증용이다.

    판정기는 요청에 담긴 제안 내용만 보므로, 재료와 문장이 같은 사례는 같은 사례로 본다
    (그런 사례끼리는 기대가 같다).
    """

    def rule(state, name, question) -> float:
        suggestion = state["suggestions"][0]
        case = next(
            case
            for case in spec["cases"]
            if case["ingredients"] == suggestion["ingredients"]
            and {**spec["suggestion_defaults"], **case}["what_to_try"] == suggestion["what_to_try"]
            and {**spec["suggestion_defaults"], **case}["serving_tip"] == suggestion["serving_tip"]
        )
        if name.endswith("_text"):
            return 0.95 if case["text_risky"] else 0.02
        position = int(name.rsplit("ingredient", 1)[1])
        return 0.95 if suggestion["ingredients"][position] in case["risky_ingredients"] else 0.02

    return ScriptedJudge(rule)


async def test_a_perfect_judge_meets_every_declared_threshold() -> None:
    spec, limits = spec_and_limits()

    results = await evaluate(perfect_judge(spec), spec)
    rates = metrics(results, limits["risk_threshold"])

    assert failed_metrics(limits, rates) == []
    assert all(rate.total > 0 for rate in rates.values())
    assert "FAIL" not in format_report(limits, results)


async def test_a_judge_that_never_flags_fails_the_recall_metrics() -> None:
    spec, limits = spec_and_limits()

    results = await evaluate(ScriptedJudge(), spec)

    failed = failed_metrics(limits, metrics(results, limits["risk_threshold"]))
    assert {"core_recall", "hard_recall", "prose_recall"} <= set(failed)
    assert "false_rejection_rate" not in failed


async def test_a_judge_that_always_flags_fails_the_false_rejection_metrics() -> None:
    spec, limits = spec_and_limits()

    results = await evaluate(ScriptedJudge(lambda state, name, question: 0.99), spec)

    failed = failed_metrics(limits, metrics(results, limits["risk_threshold"]))
    assert {"false_rejection_rate", "safe_case_pass"} <= set(failed)
    assert "core_recall" not in failed
