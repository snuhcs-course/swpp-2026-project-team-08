# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 입력에 식후 리뷰 정보를, 제안에 조리법·원인을 더하고 카탈로그를 그래프 입력으로 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 재료별 리뷰 결과와 아이가 잘 먹는 음식(safe food, EATEN)을 그래프 입력에 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 거절한 추천과 보호자 제외 이유 입력

"""워크플로의 입출력 값과 그래프 상태. ORM 객체가 아니라 평범한 값만 담는다."""

from dataclasses import dataclass
from typing import Annotated, Literal, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.features.suggestions.ingredients import Catalog
from app.models.meal_enums import MealCookingMethod


@dataclass(frozen=True)
class IngredientResult:
    """음식 안의 재료 하나에 대한 식후 리뷰. 보호자가 따로 기록한 재료만 담는다.

    `outcome` 은 `EatingOutcome` 값이고 `difficulty_reasons` 는 `DifficultyReason` 값이다.
    """

    name: str
    outcome: str
    difficulty_reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class RejectedSuggestion:
    """보호자가 거절한 추천. 아이의 식후 반응과 구분한다."""

    what_to_try: str
    why_this_may_help: str
    serving_tip: str | None
    dismiss_reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class FoodInput:
    """제안을 만들 음식 하나와, 아이가 어려워한 원인을 서술하는 데 쓸 식후 리뷰 정보.

    `outcome` 은 `EatingOutcome` 값이고 `difficulty_reasons` 는 `DifficultyReason` 값이다.
    `ingredient_results` 는 재료를 따로 리뷰한 경우의 재료별 결과다.
    """

    id: str
    name: str
    ingredients: tuple[str, ...] = ()
    cooking_method: str | None = None
    outcome: str = ""
    difficulty_reasons: tuple[str, ...] = ()
    ingredient_results: tuple[IngredientResult, ...] = ()
    rejected_suggestion: RejectedSuggestion | None = None


@dataclass(frozen=True)
class FamiliarSafeFood:
    """보호자가 프로필에 적은, 아이가 안정적으로 먹는 음식(safe food).

    `preparation` 과 `presentation_note` 는 그 음식이 기록된 조리·제공 형태다.
    """

    name: str
    preparation: str | None = None
    presentation_note: str | None = None


@dataclass(frozen=True)
class FamiliarEatenFood:
    """과거 식사에서 아이가 먹은(`EATEN`) 것으로 리뷰된 음식."""

    name: str
    cooking_method: str | None = None
    ingredients: tuple[str, ...] = ()


@dataclass(frozen=True)
class FamiliarFoods:
    """아이가 잘 먹는다고 기록된 음식들. 새 제안을 익숙한 것과 이어 주는 데 쓴다."""

    safe_foods: tuple[FamiliarSafeFood, ...] = ()
    eaten_foods: tuple[FamiliarEatenFood, ...] = ()


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
    familiar: FamiliarFoods


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
