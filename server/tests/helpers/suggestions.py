# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Explicit LLM responses for API integration; the real graph/validation still run."""

from langchain_core.messages import AIMessage

from app.features.suggestions.workflow.schemas import SuggestionDraft, SuggestionsDraft
from tests.helpers.fake_chat_model import ScriptedChatModel


def suggestion_draft(food_id: str = "0", *, serving_tip: str = "작게 잘라 제공"):
    return SuggestionDraft(
        food_id=food_id,
        what_to_try="소량 제공",
        why_this_may_help="익숙한 형태로 제공",
        serving_tip=serving_tip,
        used_ingredients=["rice"],
    )


def install_model(monkeypatch, batches):
    model = ScriptedChatModel(replies=[AIMessage(content="ready")], drafts=batches)
    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", lambda: model)
    return model


def batch(*food_ids: str):
    return SuggestionsDraft(suggestions=[suggestion_draft(value) for value in food_ids])
