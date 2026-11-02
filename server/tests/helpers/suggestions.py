# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 새 초안 필드, DB 카탈로그·프로필 시드 헬퍼로 변경
"""Explicit LLM responses and DB seeds for API integration; the real graph/validation still run."""

from httpx import AsyncClient

from app.core.database import get_session
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.main import app
from app.models import Ingredient, IngredientRestriction
from app.models.ingredient_enums import RestrictionDegree
from app.models.restriction_enums import RestrictionType
from tests.fixtures.onboarding import request_body
from tests.helpers.fake_chat_model import ScriptedChatModel

# tests/fixtures/onboarding.py 프로필의 제한.
# 카탈로그 재료는 이 둘에 NEVER 판정이 있어야 쓸 수 있다.
PROFILE_RESTRICTIONS = (RestrictionType.ALLERGY_EGGS, RestrictionType.VEGETARIAN_DAIRY)


def suggestion_draft(food_id: str = "0", *, serving_tip: str = "작게 잘라 제공", **fields):
    values = {
        "food_id": food_id,
        "what_to_try": "소량 제공",
        "why_this_may_help": "익숙한 형태로 제공",
        "serving_tip": serving_tip,
        "ingredients": ["쌀"],
        "cooking_method": "STEAMED",
        "causes": "Soft texture was hard for the child.",
        **fields,
    }
    return SuggestionDraft(**values)


def install_model(monkeypatch, batches):
    model = ScriptedChatModel(drafts=batches)
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: model)
    return model


def batch(*food_ids: str):
    return SuggestionsDraft(suggestions=[suggestion_draft(value) for value in food_ids])


async def seed_ingredient(
    name: str, judgements: dict[RestrictionType, RestrictionDegree] | None = None
) -> None:
    """재료 하나와 제한 판정을 만든다. 판정을 주지 않으면 프로필 제한 모두에 NEVER 를 준다."""
    if judgements is None:
        judgements = dict.fromkeys(PROFILE_RESTRICTIONS, RestrictionDegree.NEVER)
    # 루프 안에서 return 하면 세션이 커밋되기 전에 닫히므로 루프를 끝까지 돈다.
    async for session in app.dependency_overrides[get_session]():
        ingredient = Ingredient(korean_name=name)
        session.add(ingredient)
        await session.flush()
        session.add_all(
            IngredientRestriction(ingredient_id=ingredient.id, restriction_type=kind, degree=degree)
            for kind, degree in judgements.items()
        )


async def save_profile(client: AsyncClient, headers: dict[str, str]) -> None:
    response = await client.put("/api/v1/onboarding", headers=headers, json=request_body())
    assert response.status_code == 200, response.text
