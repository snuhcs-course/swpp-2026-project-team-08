# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 아이의 제한 대신 쓸 수 있는 재료 카탈로그를 그래프에 넘기도록 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 아이가 잘 먹는 음식(familiar)을 선택 입력으로 그래프에 넘기도록 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 아이의 제한 설명과 가드레일 판정기·임계값을 그래프에 넘기도록 변경

"""서비스가 부르는 제안 생성의 단일 진입점.

서비스는 그래프를 직접 다루지 않고 이 함수만 부른다. 타임아웃과 에러 변환은 서비스가 맡는다.
"""

import logging

from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import get_settings
from app.core.errors import AppError
from app.features.suggestions.ingredients import Catalog
from app.features.suggestions.workflow.graph import graph
from app.features.suggestions.workflow.llm import build_chat_model, build_judge
from app.features.suggestions.workflow.state import (
    FamiliarFoods,
    FoodInput,
    GeneratedSuggestion,
    RiskJudge,
    SuggestionContext,
    ValidationProblem,
)

logger = logging.getLogger(__name__)

# prepare → compose ⇄ validate 재시도를 합친 그래프 단계 수의 상한.
RECURSION_LIMIT = 25


class GenerationRejectedError(AppError):
    """재시도를 다 쓰고도 검증을 통과하지 못했다. 이 결과는 저장하지 않는다."""

    def __init__(self, problems: list[ValidationProblem]) -> None:
        super().__init__()
        self.problems = problems


async def generate_suggestions(
    foods: list[FoodInput],
    catalog: Catalog,
    *,
    restrictions: tuple[str, ...] = (),
    familiar: FamiliarFoods | None = None,
    llm: BaseChatModel | None = None,
    judge: RiskJudge | None = None,
    risk_threshold: float | None = None,
) -> list[GeneratedSuggestion]:
    """음식마다 제안을 만든다. 검증을 통과하지 못하면 `GenerationRejectedError`를 던진다.

    `catalog`는 이 아이가 쓸 수 있는 재료다. `restrictions`는 아이의 제한 설명으로, 가드레일이
    제안이 이에 어긋날 확률을 판정하는 데 쓰며 비어 있으면 판정하지 않는다. `familiar`는 아이가
    잘 먹는다고 기록된 음식으로, 제안을 익숙한 것과 이어 주는 근거로만 쓰며 없으면 비워 둔다.
    `llm`, `judge`, `risk_threshold`를 넘기지 않으면 설정에서 만든다 (테스트는 가짜를 넘긴다).
    """
    output = await graph.ainvoke(
        {
            "foods": foods,
            "catalog": catalog,
            "familiar": familiar or FamiliarFoods(),
            "restrictions": restrictions,
        },
        context=SuggestionContext(
            llm=llm or build_chat_model(),
            judge=judge or build_judge(),
            risk_threshold=(
                risk_threshold
                if risk_threshold is not None
                else get_settings().GUARDRAIL_RISK_THRESHOLD
            ),
        ),
        config={"recursion_limit": RECURSION_LIMIT},
    )
    problems = output["problems"]
    if problems:
        logger.warning("제안 생성 검증 실패: %s", sorted({problem.kind for problem in problems}))
        raise GenerationRejectedError(problems)
    return output["results"]
