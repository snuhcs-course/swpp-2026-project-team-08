# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 판정 모델(Jev)을 정답 세트로 평가하는 스크립트 추가

"""가드레일 판정 모델(Jev)을 정답 세트로 평가한다. 실제 API 를 호출하므로 pytest 가 아닌 스크립트다.

서버 디렉터리에서 실행한다. OpenRouter 키가 필요하고 호출 비용이 든다 (사례 38건, 호출 38번).

    uv run python scripts/evaluate_guardrail.py

`tests/eval/guardrail_judge_ground_truth.json` 의 사례마다 가드레일 노드와 같은 질문을 판정 모델에
보내고, `tests/eval/guardrail_judge_thresholds.json` 에 미리 선언한 기준과 비교한다.
기준을 못 맞추면 종료 코드 1 이다. 채점 로직은 오프라인 테스트
(`tests/eval/test_guardrail_judge_set.py`)가 가짜 판정기로 검증한다.
"""

import asyncio
import json
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings  # noqa: E402
from app.features.suggestions.workflow.guardrail import build_request  # noqa: E402
from app.features.suggestions.workflow.jev import JevClient  # noqa: E402
from app.features.suggestions.workflow.restrictions import describe_restrictions  # noqa: E402
from app.features.suggestions.workflow.state import GeneratedSuggestion, RiskJudge  # noqa: E402
from app.models.meal_enums import MealCookingMethod  # noqa: E402
from app.models.restriction_enums import RestrictionType  # noqa: E402

EVAL_DIR = ROOT / "tests" / "eval"
FOOD_ID = "f1"
CONCURRENCY = 4
INGREDIENT_GROUPS = {
    "core_recall": {"core_ingredient", "multiple_restrictions"},
    "hard_recall": {"hard_ingredient"},
}
SAFE_GROUPS = {"safe", "safe_negation"}
SWEEP = (0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9)


@dataclass(frozen=True)
class CaseResult:
    """사례 하나에 대한 판정: 제안 문장과 재료마다의 위험 확률."""

    case: dict
    text: float
    ingredients: dict[str, float]


@dataclass(frozen=True)
class Rate:
    hits: int
    total: int

    @property
    def value(self) -> float:
        return self.hits / self.total if self.total else 0.0


def load_json(name: str) -> dict:
    return json.loads((EVAL_DIR / name).read_text(encoding="utf-8"))


def build_suggestion(spec: dict, case: dict) -> GeneratedSuggestion:
    values = {**spec["suggestion_defaults"], **case}
    return GeneratedSuggestion(
        food_id=FOOD_ID,
        what_to_try=values["what_to_try"],
        why_this_may_help=values["why_this_may_help"],
        serving_tip=values["serving_tip"],
        ingredients=tuple(values["ingredients"]),
        cooking_method=MealCookingMethod.STEAMED,
        causes="The texture was hard for the child.",
    )


async def judge_case(judge: RiskJudge, spec: dict, case: dict) -> CaseResult:
    """가드레일 노드와 같은 요청을 만들어 판정 모델에 보낸다."""
    restrictions = describe_restrictions(RestrictionType(code) for code in case["restrictions"])
    request = build_request(restrictions, [build_suggestion(spec, case)])
    probabilities = await judge.ask(request.state, request.questions)
    ingredients = {
        ingredient: probabilities[name]
        for name, (_, ingredient) in request.targets.items()
        if ingredient is not None
    }
    text = next(probabilities[name] for name, (_, ing) in request.targets.items() if ing is None)
    return CaseResult(case=case, text=text, ingredients=ingredients)


async def evaluate(judge: RiskJudge, spec: dict) -> list[CaseResult]:
    gate = asyncio.Semaphore(CONCURRENCY)

    async def one(case: dict) -> CaseResult:
        async with gate:
            return await judge_case(judge, spec, case)

    return list(await asyncio.gather(*(one(case) for case in spec["cases"])))


def _flags(result: CaseResult, threshold: float) -> tuple[list[str], bool]:
    """위험으로 판정된 재료 이름들과 제안 문장의 위험 여부."""
    flagged = [name for name, risk in result.ingredients.items() if risk >= threshold]
    return flagged, result.text >= threshold


def metrics(results: list[CaseResult], threshold: float) -> dict[str, Rate]:
    """선언한 지표를 계산한다. 정의는 `guardrail_judge_thresholds.json` 에 있다."""
    rates: dict[str, Rate] = {}
    for metric, groups in INGREDIENT_GROUPS.items():
        expected = [
            (result, name)
            for result in results
            if result.case["group"] in groups
            for name in result.case["risky_ingredients"]
        ]
        rates[metric] = Rate(
            sum(result.ingredients[name] >= threshold for result, name in expected), len(expected)
        )

    prose = [result for result in results if result.case["text_risky"]]
    rates["prose_recall"] = Rate(sum(r.text >= threshold for r in prose), len(prose))

    false_hits = safe_questions = 0
    for result in results:
        risky = set(result.case["risky_ingredients"])
        safe_risks = [risk for name, risk in result.ingredients.items() if name not in risky]
        if not result.case["text_risky"]:
            safe_risks.append(result.text)
        safe_questions += len(safe_risks)
        false_hits += sum(risk >= threshold for risk in safe_risks)
    rates["false_rejection_rate"] = Rate(false_hits, safe_questions)

    safe_cases = [result for result in results if result.case["group"] in SAFE_GROUPS]
    clean = [result for result in safe_cases if _flags(result, threshold) == ([], False)]
    rates["safe_case_pass"] = Rate(len(clean), len(safe_cases))
    return rates


def passes(limit: dict, rate: Rate) -> bool:
    if rate.total == 0:
        return False
    if limit["direction"] == "min":
        return rate.value >= limit["threshold"]
    return rate.value <= limit["threshold"]


def failed_metrics(limits: dict, rates: dict[str, Rate]) -> list[str]:
    return [name for name, limit in limits["metrics"].items() if not passes(limit, rates[name])]


def wrong_questions(results: list[CaseResult], threshold: float) -> list[str]:
    """기대와 다르게 판정된 질문을 사례 번호와 함께 나열한다."""
    lines = []
    for result in results:
        case = result.case
        risky = set(case["risky_ingredients"])
        for name, risk in result.ingredients.items():
            if (risk >= threshold) != (name in risky):
                kind = "MISSED" if name in risky else "FALSE ALARM"
                lines.append(f"{kind} {case['id']} ingredient '{name}' p={risk:.2f}")
        if (result.text >= threshold) != case["text_risky"]:
            kind = "MISSED" if case["text_risky"] else "FALSE ALARM"
            lines.append(f"{kind} {case['id']} text p={result.text:.2f}")
    return lines


def format_report(limits: dict, results: list[CaseResult]) -> str:
    threshold = limits["risk_threshold"]
    rates = metrics(results, threshold)
    lines = [f"cases: {len(results)}  risk threshold: {threshold}"]
    for name, limit in limits["metrics"].items():
        rate = rates[name]
        mark = "PASS" if passes(limit, rate) else "FAIL"
        lines.append(
            f"{name}: {rate.hits}/{rate.total} = {rate.value:.1%} "
            f"({limit['direction']} {limit['threshold']:.0%}) {mark}"
        )
    lines.append("")
    lines.append("threshold sweep (informational):  T   core_recall  prose_recall  false_rejection")
    for value in SWEEP:
        swept = metrics(results, value)
        lines.append(
            f"                                  {value:.1f}   {swept['core_recall'].value:>9.1%}"
            f"  {swept['prose_recall'].value:>11.1%}  {swept['false_rejection_rate'].value:>13.1%}"
        )
    wrong = wrong_questions(results, threshold)
    lines.append("")
    lines.append(f"misjudged questions at {threshold}: {len(wrong)}")
    lines.extend(wrong)
    return "\n".join(lines)


async def run() -> int:
    spec, limits = (
        load_json("guardrail_judge_ground_truth.json"),
        load_json("guardrail_judge_thresholds.json"),
    )
    settings = get_settings()
    judge = JevClient(settings.OPENROUTER_API_KEY, settings.GUARDRAIL_MODEL)
    print(f"model: {settings.GUARDRAIL_MODEL}")
    results = await evaluate(judge, spec)
    print(format_report(limits, results))
    return 1 if failed_metrics(limits, metrics(results, limits["risk_threshold"])) else 0


def main() -> None:
    raise SystemExit(asyncio.run(run()))


if __name__ == "__main__":
    main()
