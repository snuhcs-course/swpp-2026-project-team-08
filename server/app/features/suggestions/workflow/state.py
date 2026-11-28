# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 기능 제거
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 추천 문맥 반영
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: ingredients 구조 bootstrap
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 음식 입력에 식후 리뷰 정보를, 제안에 조리법·원인을 더하고 카탈로그를 그래프 입력으로 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-04, reviewed by Jaemin Kim
# Changed: 재료별 리뷰 결과와 아이가 잘 먹는 음식(safe food, EATEN)을 그래프 입력에 추가

# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 거절한 추천과 보호자 제외 이유 입력
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 입력(restrictions)·판정기(RiskJudge)·restriction_risk 문제 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 홈 화면 음식 추천 입력(연령대·편식 가설·추천 이력)과 출력(음식·재료·제공 방법)으로 개편

"""워크플로의 입출력 값과 그래프 상태. ORM 객체가 아니라 평범한 값만 담는다."""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Annotated, Any, Literal, Protocol, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

from app.features.suggestions.ingredients import Catalog


@dataclass(frozen=True)
class IngredientResult:
    """음식 안의 재료 하나에 대한 식후 리뷰. 보호자가 따로 기록한 재료만 담는다.

    `outcome` 은 `EatingOutcome` 값이고 `difficulty_reasons` 는 `DifficultyReason` 값이다.
    """

    name: str
    outcome: str
    difficulty_reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class DifficultFood:
    """최근 식후 리뷰에서 아이가 잘 먹지 못한(`EATEN` 이 아닌) 음식.

    `difficulty_reasons` 는 보호자가 추정한 이유(가설)이며 사실로 단정하지 않는다.
    `outcome` 은 `EatingOutcome` 값이고 `difficulty_reasons` 는 `DifficultyReason` 값이다.
    `ingredient_results` 는 재료를 따로 리뷰한 경우의 재료별 결과다.
    """

    name: str
    outcome: str
    ingredients: tuple[str, ...] = ()
    cooking_method: str | None = None
    difficulty_reasons: tuple[str, ...] = ()
    ingredient_results: tuple[IngredientResult, ...] = ()


@dataclass(frozen=True)
class PastRecommendation:
    """지금까지 만든 추천 하나와 보호자의 결정.

    `status` 는 `FoodRecommendationStatus` 값이고 `dismiss_reasons` 는
    `FoodRecommendationDismissReason` 값이다. 거절 이유는 보호자의 판단이며 아이의 반응이 아니다.
    """

    what_to_try: str
    status: str
    dismiss_reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class FamiliarEatenFood:
    """과거 식사에서 아이가 먹은(`EATEN`) 것으로 리뷰된 음식."""

    name: str
    cooking_method: str | None = None
    ingredients: tuple[str, ...] = ()


@dataclass(frozen=True)
class RefusedFood:
    """Caregiver-reported refusal in the recorded preparation."""

    name: str
    cooking_method: str | None = None
    reasons: tuple[str, ...] = ()


@dataclass(frozen=True)
class FamiliarFoods:
    """아이가 잘 먹는다고 기록된 음식들. 추천을 익숙한 것과 이어 주는 데 쓴다."""

    eaten_foods: tuple[FamiliarEatenFood, ...] = ()
    refused_foods: tuple[RefusedFood, ...] = ()


@dataclass(frozen=True)
class GeneratedSuggestion:
    """LLM이 만든 음식 추천 하나.

    `what_to_try` 는 음식 이름, `ingredients` 는 그 음식의 재료,
    `preparation_method` 는 편식을 덜기 위해 이 음식을 제공할 때 고려할 사항이다.
    """

    what_to_try: str
    why_this_may_help: str
    ingredients: tuple[str, ...]
    preparation_method: str


@dataclass(frozen=True)
class ValidationProblem:
    """검증에서 발견한 문제 하나. 자연어 문구는 갖지 않는다.

    `position` 은 문제가 있는 추천의 순서(0부터)이고, 응답 전체의 문제(`wrong_count`)면 `None`
    이다. `wrong_count` 의 `count` 는 실제로 받은 추천 개수다.
    `restriction_risk` 는 가드레일이 아이의 제한에 어긋날 가능성이 높다고 판정한 것이다.
    `ingredient` 가 있으면 그 재료가, 없으면 추천 문장이 대상이고 `risk` 는 그 확률(0~1)이다.
    """

    kind: Literal[
        "wrong_count",
        "blank_field",
        "empty_ingredients",
        "unavailable_ingredient",
        "duplicate_food",
        "repeated_food",
        "restriction_risk",
    ]
    position: int | None = None
    field: str | None = None
    ingredient: str | None = None
    risk: float | None = None
    count: int | None = None


class InputState(TypedDict):
    """그래프를 호출할 때 넘기는 값. 이 키들만 받는다."""

    # 만들 추천 개수.
    count: int
    # 아이의 연령대(`AgeGroup` 값).
    age_group: str
    # 편식 성향 가설: 최근 잘 먹지 못한 음식과 보호자가 추정한 이유.
    difficult_foods: tuple[DifficultFood, ...]
    familiar: FamiliarFoods
    # 지금까지의 추천. 같은 음식을 다시 추천하지 않는 데 쓴다.
    history: tuple[PastRecommendation, ...]
    catalog: Catalog
    # 가드레일 판정 모델에 보낼 아이의 제한 설명. 비어 있으면 가드레일은 판정하지 않는다.
    restrictions: tuple[str, ...]


class OutputState(TypedDict):
    """그래프가 끝났을 때 돌려주는 값.

    `problems`가 비어 있지 않으면 재시도를 다 쓰고도 검증을 통과하지 못한 것이다.
    """

    results: list[GeneratedSuggestion]
    problems: list[ValidationProblem]


class GraphState(InputState, OutputState):
    """노드들이 주고받는 전체 상태 (입력 + 출력 + 내부 값).

    `messages`는 compose가 쓰는 대화(시스템·사용자 메시지, 초안, 피드백)이고, `attempts`는
    compose를 실행한 횟수다. 내부 값은 `prepare` 노드가 초기화한다.
    """

    messages: Annotated[list[AnyMessage], add_messages]
    attempts: int


class RiskJudge(Protocol):
    """가드레일이 쓰는 판정 모델. 질문마다 '예'일 확률(0~1)을 돌려준다.

    `questions` 는 질문 이름 → 질문 문장이고, 결과는 같은 이름으로 묶는다.
    """

    async def ask(self, state: Any, questions: Mapping[str, str]) -> dict[str, float]: ...


@dataclass(frozen=True)
class SuggestionContext:
    """실행마다 주입하는 의존성. 데이터(상태)가 아니라 실행에 필요한 도구다.

    노드는 `runtime: Runtime[SuggestionContext]` 인자로 받는다. 테스트는 가짜 모델을 넣는다.
    `risk_threshold` 이상의 위험 확률이면 가드레일이 그 추천을 거부한다.
    """

    llm: BaseChatModel
    judge: RiskJudge
    risk_threshold: float
