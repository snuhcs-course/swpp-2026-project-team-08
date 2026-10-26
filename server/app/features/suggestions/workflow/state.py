# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""워크플로의 입출력 값과 그래프 상태. ORM 객체가 아니라 평범한 값만 담는다."""

from dataclasses import dataclass
from typing import Annotated, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.features.suggestions.ingredients import Catalog, ChildRestrictions, RestrictionId


@dataclass(frozen=True)
class FoodInput:
    """제안을 만들 음식 하나."""

    id: str
    name: str


@dataclass(frozen=True)
class GeneratedSuggestion:
    """LLM이 음식 하나에 대해 만든 제안.

    `used_ingredients`는 제안하는 음식에 들어가는 재료다 (기록된 음식의 재료가 아니다).
    """

    food_id: str
    what_to_try: str
    why_this_may_help: str
    serving_tip: str
    used_ingredients: tuple[str, ...]


@dataclass(frozen=True)
class ValidationProblem:
    """검증에서 발견한 문제 하나. 자연어 문구는 갖지 않는다."""

    kind: Literal[
        "missing_food",
        "unexpected_food",
        "duplicate_food",
        "blank_field",
        "empty_ingredients",
        "unknown_ingredient",
        "restricted_ingredient",
    ]
    food_id: str = ""
    field: str | None = None
    ingredient: str | None = None
    restrictions: tuple[RestrictionId, ...] = ()


class InputState(TypedDict):
    """그래프를 호출할 때 넘기는 값. 이 키들만 받는다."""

    foods: list[FoodInput]
    restrictions: ChildRestrictions
    catalog: Catalog


class OutputState(TypedDict):
    """그래프가 끝났을 때 돌려주는 값.

    `problems`가 비어 있지 않으면 재시도를 다 쓰고도 검증을 통과하지 못한 것이다.
    """

    results: list[GeneratedSuggestion]
    problems: list[ValidationProblem]


class GraphState(InputState, OutputState):
    """노드들이 주고받는 전체 상태 (입력 + 출력 + 내부 값).

    `messages`는 agent와 tools가 주고받은 대화이고, `attempts`는 compose를 실행한 횟수다.
    내부 값은 `prepare` 노드가 초기화한다.
    """

    messages: Annotated[list[AnyMessage], add_messages]
    attempts: int


@dataclass(frozen=True)
class SuggestionContext:
    """실행마다 주입하는 의존성. 데이터(상태)가 아니라 실행에 필요한 도구다.

    노드는 `runtime: Runtime[SuggestionContext]` 인자로 받는다. 테스트는 가짜 모델을 넣는다.
    """

    llm: BaseChatModel
