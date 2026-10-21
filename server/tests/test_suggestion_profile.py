# AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
"""Profile restrictions reach the real graph; only the chat model is replaced."""

import json

import pytest
from httpx import AsyncClient
from langchain_core.messages import AIMessage, ToolMessage
from sqlalchemy import delete

from app.core.database import get_session
from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.features.suggestions.profile import load_restrictions
from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from app.main import app
from app.models import UserProfile, UserProfileChoice
from tests.fake_chat_model import ScriptedChatModel
from tests.test_api_contract_edges import login, review_meal, save_meal
from tests.test_onboarding import request_body


def draft(*ingredients: str) -> SuggestionsDraft:
    return SuggestionsDraft(
        suggestions=[
            SuggestionDraft(
                food_id="0",
                what_to_try="작게 잘라 제공",
                why_this_may_help="익숙한 형태",
                serving_tip="따로 담기",
                used_ingredients=list(ingredients),
            )
        ]
    )


async def test_owner_profile_reaches_tools_and_validation_and_is_reloaded(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner = await login(client, "owner@example.com")
    other = await login(client, "other@example.com")
    body = request_body()
    body["profile"]["safety"]["restrictions"] = {
        "status": "specified",
        "items": [{"code": "no-pork", "custom_name": None}],
    }
    assert (await client.put("/api/v1/onboarding", headers=owner, json=body)).status_code == 200
    body["profile"]["safety"]["allergies"]["items"][0]["code"] = "milk"
    assert (await client.put("/api/v1/onboarding", headers=other, json=body)).status_code == 200
    meal_id = await save_meal(client, owner, "2026-10-22")
    assert (await review_meal(client, owner, meal_id)).status_code == 200
    path = f"/api/v1/meals/{meal_id}/suggestions"
    llm = ScriptedChatModel(
        replies=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "search_available_ingredients",
                        "args": {"candidates": ["egg", "ham", "milk", "rice"]},
                        "id": "check-owner",
                    }
                ],
            ),
            AIMessage(content="확인 끝"),
        ],
        drafts=[draft("egg", "ham"), draft("milk", "rice")],
    )
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: llm)
    response = await client.post(
        path, headers=owner, json={"targets": [{"food_id": "1", "ingredient_id": None}]}
    )
    assert response.status_code == 201, response.text
    tool_results = [m for m in llm.compose_inputs[0] if isinstance(m, ToolMessage)]
    assert json.loads(tool_results[0].content) == ["milk", "rice"]
    assert len(llm.compose_inputs) == 2
    feedback = str(llm.compose_inputs[1][-1].content)
    assert "egg" in feedback and "no-pork" in feedback

    # Reload the edited profile without the mock or the other user's milk allergy.
    body["profile"]["safety"] = {
        "allergies": {"status": "none_known", "items": []},
        "restrictions": {"status": "none", "items": []},
    }
    assert (await client.put("/api/v1/onboarding", headers=owner, json=body)).status_code == 200
    next_llm = ScriptedChatModel(
        replies=[AIMessage(content="확인 끝")], drafts=[draft("egg", "ham", "milk")]
    )
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: next_llm)
    response = await client.post(
        path, headers=owner, json={"targets": [{"food_id": "1", "ingredient_id": None}]}
    )
    assert response.status_code == 201, response.text
    assert len(next_llm.compose_inputs) == 1


@pytest.mark.parametrize("restriction_id", list(RestrictionId))
async def test_every_supported_profile_code_maps_to_restriction_id(
    client: AsyncClient, restriction_id: RestrictionId
) -> None:
    headers = await login(client, "owner@example.com")
    user_id = int((await client.get("/api/v1/auth/me", headers=headers)).json()["id"])
    async for session in app.dependency_overrides[get_session]():
        profile = await session.get(UserProfile, user_id)
        profile.restriction_status = "specified"
        session.add(
            UserProfileChoice(
                user_id=user_id, category="restriction", position=0, code=restriction_id.value
            )
        )
        # Unrelated free-text preferences must not be treated as dietary restrictions.
        session.add(
            UserProfileChoice(
                user_id=user_id,
                category="family_food",
                position=0,
                custom_name="custom family food",
            )
        )
        await session.flush()
        assert await load_restrictions(session, user_id) == ChildRestrictions(
            ids=frozenset({restriction_id})
        )


@pytest.mark.parametrize("case", ["missing", "unknown", "custom", "unsupported", "inconsistent"])
async def test_unresolved_restrictions_do_not_block_generation(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch, case: str
) -> None:
    headers = await login(client, "owner@example.com")
    user_id = int((await client.get("/api/v1/auth/me", headers=headers)).json()["id"])
    meal_id = await save_meal(client, headers, "2026-10-22")
    assert (await review_meal(client, headers, meal_id)).status_code == 200
    async for session in app.dependency_overrides[get_session]():
        profile = await session.get(UserProfile, user_id)
        if case == "missing":
            await session.execute(delete(UserProfile).where(UserProfile.user_id == user_id))
        elif case == "unknown":
            profile.allergy_status = "unknown"
        else:
            profile.allergy_status = "specified"
            if case != "inconsistent":
                session.add(
                    UserProfileChoice(
                        user_id=user_id,
                        category="allergy",
                        position=0,
                        custom_name="직접 입력한 알레르기" if case == "custom" else None,
                        code="future-code" if case == "unsupported" else None,
                    )
                )

    llm = ScriptedChatModel(replies=[AIMessage(content="확인 끝")], drafts=[draft("egg", "milk")])
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: llm)
    path = f"/api/v1/meals/{meal_id}/suggestions"
    response = await client.post(
        path, headers=headers, json={"targets": [{"food_id": "1", "ingredient_id": None}]}
    )
    assert response.status_code == 201, response.text
    assert len(llm.compose_inputs) == 1
    assert len((await client.get(f"{path}?status=all", headers=headers)).json()) == 1


async def test_unknown_allergies_and_custom_choices_keep_known_dietary_restrictions(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    headers = await login(client, "owner@example.com")
    body = request_body()
    body["profile"]["safety"] = {
        "allergies": {"status": "unknown", "items": []},
        "restrictions": {
            "status": "specified",
            "items": [
                {"code": "no-pork", "custom_name": None},
                {"code": None, "custom_name": "직접 입력"},
                {"code": "future-code", "custom_name": None},
            ],
        },
    }
    assert (await client.put("/api/v1/onboarding", headers=headers, json=body)).status_code == 200
    meal_id = await save_meal(client, headers, "2026-10-22")
    assert (await review_meal(client, headers, meal_id)).status_code == 200
    llm = ScriptedChatModel(
        replies=[AIMessage(content="확인 끝")], drafts=[draft("ham"), draft("egg")]
    )
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: llm)
    response = await client.post(
        f"/api/v1/meals/{meal_id}/suggestions",
        headers=headers,
        json={"targets": [{"food_id": "1", "ingredient_id": None}]},
    )
    assert response.status_code == 201, response.text
    assert len(llm.compose_inputs) == 2
    assert "no-pork" in str(llm.compose_inputs[1][-1].content)
