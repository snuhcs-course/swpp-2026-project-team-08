# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Pending meal links are independent of recorded suggestion attempts."""

from dataclasses import dataclass

from app.core.errors import AppError


class InvalidMealLinkError(AppError):
    pass


@dataclass(frozen=True)
class SuggestionLinkData:
    suggestion_id: str
    food_id: str
    title: str
    description: str
    serving_tip: str | None = None


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
@dataclass(frozen=True)
class SuggestionFeedbackData:
    tried: bool
