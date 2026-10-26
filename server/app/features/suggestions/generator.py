# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow

"""서비스가 부르는 제안 생성의 단일 진입점.

서비스는 그래프를 직접 다루지 않고 이 함수만 부른다. 타임아웃과 에러 변환은 서비스가 맡는다.
"""

import logging

from langchain_core.language_models.chat_models import BaseChatModel

from app.core.errors import AppError
from app.features.suggestions.ingredients import ChildRestrictions
from app.features.suggestions.workflow.graph import graph
from app.features.suggestions.workflow.llm import build_chat_model
from app.features.suggestions.workflow.state import (
    FoodInput,
    GeneratedSuggestion,
    SuggestionContext,
    ValidationProblem,
)

logger = logging.getLogger(__name__)

# agent ⇄ tools 도구 호출 루프와 재시도를 합친 그래프 단계 수의 상한.
RECURSION_LIMIT = 25


class GenerationRejectedError(AppError):
    """재시도를 다 쓰고도 검증을 통과하지 못했다. 이 결과는 저장하지 않는다."""

    def __init__(self, problems: list[ValidationProblem]) -> None:
        super().__init__()
        self.problems = problems


async def generate_suggestions(
    foods: list[FoodInput],
    restrictions: ChildRestrictions,
    *,
    llm: BaseChatModel | None = None,
) -> list[GeneratedSuggestion]:
    """음식마다 제안을 만든다. 검증을 통과하지 못하면 `GenerationRejectedError`를 던진다.

    `llm`을 넘기지 않으면 설정에서 모델을 만든다 (테스트는 가짜 모델을 넘긴다).
    """
    output = await graph.ainvoke(
        {"foods": foods, "restrictions": restrictions},
        context=SuggestionContext(llm=llm or build_chat_model()),
        config={"recursion_limit": RECURSION_LIMIT},
    )
    problems = output["problems"]
    if problems:
        logger.warning("제안 생성 검증 실패: %s", sorted({problem.kind for problem in problems}))
        raise GenerationRejectedError(problems)
    return output["results"]
