# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""워크플로의 입출력 값과 그래프 상태. ORM 객체가 아니라 평범한 값만 담는다."""

from dataclasses import dataclass
from typing import Annotated, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
@dataclass(frozen=True)
class Difficulty:
    """식사 리뷰에서 기록한 어려움 하나 (예: 질감 - 단단함)."""

    category: str
    subcategory: str | None
    value: str


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
@dataclass(frozen=True)
class FoodInput:
    """제안을 만들 대상 하나 (음식 또는 음식 속 재료).

    재료를 대상으로 고르면 `name`은 재료 이름이고 `parent_food`가 그 재료가 들어 있던 음식 이름이다.
    """

    id: str
    name: str
    ingredients: tuple[str, ...] = ()
    cooking_method: str | None = None
    serving_note: str | None = None
    outcome: str | None = None
    difficulties: tuple[Difficulty, ...] = ()
    parent_food: str | None = None


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
@dataclass(frozen=True)
class SafeFoodInfo:
    """아이가 잘 먹는 음식 하나."""

    name: str
    preparation: str
    presentation_note: str | None = None


# AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
@dataclass(frozen=True)
class ChildContext:
    """제안을 쓸 때 참고하는 아이의 정보. 코드로 판정하지 않고 프롬프트로만 전달한다.

    `other_restrictions`는 `RestrictionId`로 바꿀 수 없는 알러지 · 식이 제한
    (직접 입력한 이름 등)이다. `refused_foods` · `refused_ingredients`는 지난 식사에서
    손도 대지 않은 음식 · 재료의 이름이다.
    """

    age_group: str | None = None
    smell_sensitivity: str | None = None
    preferred_temperature: str | None = None
    new_food_response: str | None = None
    difficult_textures: tuple[str, ...] = ()
    difficult_tastes: tuple[str, ...] = ()
    presentation_preferences: tuple[str, ...] = ()
    other_restrictions: tuple[str, ...] = ()
    safe_foods: tuple[SafeFoodInfo, ...] = ()
    refused_foods: tuple[str, ...] = ()
    refused_ingredients: tuple[str, ...] = ()


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
    # AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
    child: ChildContext


class OutputState(TypedDict):
    """그래프가 끝났을 때 돌려주는 값.

    `problems`가 비어 있지 않으면 재시도를 다 쓰고도 검증을 통과하지 못한 것이다.
    """

    results: list[GeneratedSuggestion]
    problems: list[ValidationProblem]


class GraphState(InputState, OutputState):
    """노드들이 주고받는 전체 상태 (입력 + 출력 + 내부 값).

    `messages`는 LLM에 보내는 대화이고, `attempts`는 compose를 실행한 횟수다.
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
