# AI-generated with Claude Sonnet 5.5, 2026-11-06, reviewed by Jaemin Kim
# Changed: 추천 가드레일 ground-truth 평가 세트와 사전 선언 임계값 평가 추가

"""추천 결과 가드레일의 ground-truth 평가.

`suggestion_ground_truth.json` 의 후보 제안을 실제 재료 카탈로그(`assets/*.jsonl`)에 적재한
격리된 DB 에서 `load_catalog` + `find_problems` 로 판정하고, `thresholds.json` 에 미리 선언한
기준과 비교한다. LLM 을 호출하지 않는다.

기본 테스트(`testpaths`)에는 포함되지 않는다. server/ 에서 직접 실행한다.

    uv run pytest tests/eval -q -s
"""

import json
from dataclasses import dataclass
from pathlib import Path

from app.features.suggestions.catalog import load_catalog
from app.features.suggestions.ingredients import ChildRestrictions
from app.features.suggestions.validation import find_problems
from app.features.suggestions.workflow.state import FoodInput, GeneratedSuggestion
from app.models.meal_enums import MealCookingMethod
from app.models.restriction_enums import RestrictionType
from scripts.load_ingredients import import_catalog

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parents[1] / "assets"
RESTRICTION_GROUPS = {"allergy", "dietary_approach", "depends_on_product", "multiple_restrictions"}


@dataclass(frozen=True)
class Outcome:
    case: dict
    verdict: str
    problems: frozenset[tuple[str, str, str]]

    @property
    def expected_problems(self) -> frozenset[tuple[str, str, str]]:
        return frozenset(
            (p["kind"], p.get("ingredient", ""), p.get("field", ""))
            for p in self.case["expected_problems"]
        )

    @property
    def verdict_ok(self) -> bool:
        return self.verdict == self.case["expected_verdict"]

    @property
    def problems_ok(self) -> bool:
        return self.problems == self.expected_problems


def load_json(name: str) -> dict:
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def build_suggestion(spec: dict, case: dict) -> GeneratedSuggestion:
    values = {**spec["suggestion_defaults"], **case}
    return GeneratedSuggestion(
        food_id=spec["food"]["id"],
        what_to_try=values["what_to_try"],
        why_this_may_help=values["why_this_may_help"],
        serving_tip=values["serving_tip"],
        ingredients=tuple(values["ingredients"]),
        cooking_method=MealCookingMethod(values["cooking_method"]),
        causes=values["causes"],
    )


async def evaluate(session, spec: dict) -> list[Outcome]:
    food = FoodInput(id=spec["food"]["id"], name=spec["food"]["name"])
    outcomes = []
    for case in spec["cases"]:
        restrictions = ChildRestrictions(
            frozenset(RestrictionType(r) for r in case["restrictions"])
        )
        catalog = await load_catalog(session, restrictions)
        problems = find_problems([food], [build_suggestion(spec, case)], catalog)
        outcomes.append(
            Outcome(
                case=case,
                verdict="accept" if not problems else "reject",
                problems=frozenset((p.kind, p.ingredient or "", p.field or "") for p in problems),
            )
        )
    return outcomes


def rate(outcomes: list[Outcome], passed) -> tuple[int, int]:
    return sum(1 for o in outcomes if passed(o)), len(outcomes)


def metrics(outcomes: list[Outcome]) -> dict[str, tuple[int, int]]:
    restriction = [o for o in outcomes if o.case["group"] in RESTRICTION_GROUPS]
    accept = [o for o in outcomes if o.case["group"] == "accept"]
    schema = [o for o in outcomes if o.case["group"] == "schema"]
    return {
        "verdict_accuracy": rate(outcomes, lambda o: o.verdict_ok),
        "problem_match": rate(outcomes, lambda o: o.problems_ok),
        "restriction_rejection": rate(restriction, lambda o: o.verdict_ok and o.problems_ok),
        "false_rejection_free": rate(accept, lambda o: o.verdict_ok and o.problems_ok),
        "schema_validity": rate(schema, lambda o: o.verdict_ok and o.problems_ok),
    }


def test_the_evaluation_set_is_well_formed() -> None:
    spec, limits = load_json("suggestion_ground_truth.json"), load_json("thresholds.json")
    ids = [case["id"] for case in spec["cases"]]

    assert len(ids) >= limits["minimum_cases"]
    assert len(set(ids)) == len(ids)
    assert set(limits["metrics"]) == {
        "verdict_accuracy",
        "problem_match",
        "restriction_rejection",
        "false_rejection_free",
        "schema_validity",
    }


async def test_ground_truth_cases_meet_the_declared_thresholds(session_factory) -> None:
    spec, limits = load_json("suggestion_ground_truth.json"), load_json("thresholds.json")

    async with session_factory() as session:
        await import_catalog(
            session, ASSETS / "ingredients.jsonl", ASSETS / "ingredients_restrictions.jsonl"
        )
        await session.commit()
        outcomes = await evaluate(session, spec)

    results = metrics(outcomes)
    print(f"\ncases: {len(outcomes)}")
    failed = []
    for name, (passed, total) in results.items():
        threshold = limits["metrics"][name]["threshold"]
        ok = total > 0 and passed / total >= threshold
        print(
            f"{name}: {passed}/{total} = {passed / total:.2%} (threshold {threshold:.0%}) "
            f"{'PASS' if ok else 'FAIL'}"
        )
        if not ok:
            failed.append(name)
    for outcome in outcomes:
        if not (outcome.verdict_ok and outcome.problems_ok):
            print(
                f"FAILED CASE {outcome.case['id']}: verdict={outcome.verdict} "
                f"problems={sorted(outcome.problems)}"
            )

    assert not failed, f"metrics below threshold: {failed}"
