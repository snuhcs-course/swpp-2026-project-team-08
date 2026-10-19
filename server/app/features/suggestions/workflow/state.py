# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""워크플로의 입출력 값. ORM 객체가 아니라 평범한 값만 담는다."""

from dataclasses import dataclass


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
