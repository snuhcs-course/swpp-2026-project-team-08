# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""LLM 구조화 출력 스키마.

LLM이 돌려주는 값은 외부에서 온 값이므로 Pydantic으로 파싱한다. 파싱한 뒤에는
`GeneratedSuggestion`(dataclass)으로 바꿔 워크플로 안에서는 이 스키마를 쓰지 않는다.
"""

from pydantic import BaseModel, Field

from app.features.suggestions.workflow.state import GeneratedSuggestion


class SuggestionDraft(BaseModel):
    """음식 하나에 대한 제안 초안."""

    food_id: str = Field(description="제안을 만드는 음식의 id. 요청 목록의 id를 그대로 쓴다.")
    what_to_try: str = Field(description="아이에게 시도해 볼 작은 한 걸음.")
    why_this_may_help: str = Field(description="이 시도가 도움이 될 수 있는 이유.")
    serving_tip: str = Field(description="음식을 내놓을 때의 팁.")
    used_ingredients: list[str] = Field(
        # AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim
        description="제안하는 음식에 들어가는 재료. 쓸 수 있는 재료 목록의 이름 그대로 적는다."
    )


class SuggestionsDraft(BaseModel):
    """모든 음식에 대한 제안 초안 묶음."""

    suggestions: list[SuggestionDraft]

    def to_generated(self) -> list[GeneratedSuggestion]:
        return [
            GeneratedSuggestion(
                food_id=draft.food_id,
                what_to_try=draft.what_to_try,
                why_this_may_help=draft.why_this_may_help,
                serving_tip=draft.serving_tip,
                used_ingredients=tuple(draft.used_ingredients),
            )
            for draft in self.suggestions
        ]
