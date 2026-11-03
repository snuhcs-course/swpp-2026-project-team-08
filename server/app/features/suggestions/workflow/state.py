# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 입력에 식후 리뷰 정보를, 제안에 조리법·원인을 더하고 카탈로그를 그래프 입력으로 변경

"""워크플로의 입출력 값과 그래프 상태. ORM 객체가 아니라 평범한 값만 담는다."""

from dataclasses import dataclass
from typing import Annotated, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.features.suggestions.ingredients import Catalog
from app.models.meal_enums import MealCookingMethod


@dataclass(frozen=True)
class FoodInput:
    """제안을 만들 음식 하나와, 아이가 어려워한 원인을 서술하는 데 쓸 식후 리뷰 정보.

    `outcome` 은 `EatingOutcome` 값이고 `difficulty_reasons` 는 `DifficultyReason` 값이다.
    """

    id: str
    name: str
    ingredients: tuple[str, ...] = ()
    cooking_method: str | None = None
    outcome: str = ""
    difficulty_reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class GeneratedSuggestion:
    """LLM이 음식 하나에 대해 만든 제안.

    `ingredients` 와 `cooking_method` 는 제안하는 음식의 것이다 (기록된 음식의 것이 아니다).
    `causes` 는 참고한 식후 리뷰 특성(아이가 어려워한 원인)을 서술한 문장이다.
    """

    food_id: str
    what_to_try: str
    why_this_may_help: str
    serving_tip: str
    ingredients: tuple[str, ...]
    cooking_method: MealCookingMethod
    causes: str


@dataclass(frozen=True)
class ValidationProblem:
    """검증에서 발견한 문제 하나. 자연어 문구는 갖지 않는다."""

    kind: Literal[
        "missing_food",
        "unexpected_food",
        "duplicate_food",
        "blank_field",
        "empty_ingredients",
        "unavailable_ingredient",
    ]
    food_id: str = ""
    field: str | None = None
    ingredient: str | None = None


class InputState(TypedDict):
    """그래프를 호출할 때 넘기는 값. 이 키들만 받는다."""

    foods: list[FoodInput]
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
