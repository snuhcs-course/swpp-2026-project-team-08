# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 새 초안 필드, DB 카탈로그·프로필 시드 헬퍼로 변경
# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 영어 추천 카탈로그 fixture 적용
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가짜 판정기를 설치하는 install_judge 헬퍼 추가
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 음식 이름·재료·제공 방법 초안과 추천 세 개 묶음 헬퍼로 변경
"""Explicit LLM responses and DB seeds for API integration; the real graph/validation still run."""

from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import get_session
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.main import app
from app.models import FoodRecommendation, Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType
from tests.fixtures.onboarding import request_body
from tests.helpers.fake_chat_model import ScriptedChatModel
from tests.helpers.fake_judge import ScriptedJudge

# tests/fixtures/onboarding.py 프로필의 제한.
# 카탈로그 재료는 이 둘에 NEVER 판정이 있어야 쓸 수 있다.
PROFILE_RESTRICTIONS = (RestrictionType.ALLERGY_EGGS, RestrictionType.VEGETARIAN_DAIRY)
# 한 번의 요청으로 만드는 추천 개수(서비스의 SUGGESTION_COUNT)에 맞춘 기본 음식 이름.
DEFAULT_FOOD_NAMES = ("Rice porridge", "Rice ball", "Rice cake")


def suggestion_draft(what_to_try: str = "Rice porridge", **fields) -> SuggestionDraft:
    values = {
        "what_to_try": what_to_try,
        "why_this_may_help": "It is close to the rice the child already eats.",
        "ingredients": ["Rice"],
        "preparation_method": "Serve a small, soft portion next to a familiar food.",
        **fields,
    }
    return SuggestionDraft(**values)


def install_model(monkeypatch, batches):
    model = ScriptedChatModel(drafts=batches)
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: model)
    return model


def install_judge(monkeypatch, judge: ScriptedJudge) -> ScriptedJudge:
    """기본 가짜 판정기를 테스트가 정한 판정기로 바꾼다."""
    monkeypatch.setattr("app.features.suggestions.generator.build_judge", lambda: judge)
    return judge


def batch(*names: str) -> SuggestionsDraft:
    """음식 이름마다 초안 하나를 담은 묶음. 이름을 주지 않으면 기본 추천 세 개다."""
    return SuggestionsDraft(
        suggestions=[suggestion_draft(name) for name in names or DEFAULT_FOOD_NAMES]
    )


async def seed_ingredient(
    name: str, judgements: dict[RestrictionType, RestrictionDegree] | None = None
) -> None:
    """재료 하나와 제한 판정을 만든다. 판정을 주지 않으면 프로필 제한 모두에 NEVER 를 준다."""
    if judgements is None:
        judgements = dict.fromkeys(PROFILE_RESTRICTIONS, RestrictionDegree.NEVER)
    # 루프 안에서 return 하면 세션이 커밋되기 전에 닫히므로 루프를 끝까지 돈다.
    async for session in app.dependency_overrides[get_session]():
        ingredient = Ingredient(english_name=name)
        session.add(ingredient)
        await session.flush()
        session.add_all(
            IngredientRestriction(ingredient_id=ingredient.id, restriction_type=kind, degree=degree)
            for kind, degree in judgements.items()
        )


async def save_profile(client: AsyncClient, headers: dict[str, str]) -> None:
    response = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert response.status_code == 200, response.text


async def request_suggestions(client: AsyncClient, headers: dict[str, str]) -> list[dict]:
    """홈 화면 추천을 요청하고 성공(201) 응답의 추천 목록을 돌려준다."""
    response = await client.post("/api/v1/suggestions", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def stored_suggestion_names() -> list[str]:
    """DB 에 저장된 모든 추천의 음식 이름. 상태와 사용자를 가리지 않고 저장 순서대로 읽는다."""
    names: list[str] = []
    async for session in app.dependency_overrides[get_session]():
        names = list(
            (
                await session.scalars(
                    select(FoodRecommendation.what_to_try).order_by(FoodRecommendation.id)
                )
            ).all()
        )
    return names
