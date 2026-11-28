# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: used_ingredients 를 ingredients 로 바꾸고 cooking_method, causes 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 조리 방법 선택지 설명을 싣고 재료 설명의 낡은 도구 표현 정리
# AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
# Changed: 추천 생성 조리법 열 가지와 프롬프트 설명을 일치
# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 음식 이름·이유·재료·제공 방법 네 필드의 음식 추천 출력으로 개편

"""LLM 구조화 출력 스키마.

LLM이 돌려주는 값은 외부에서 온 값이므로 Pydantic으로 파싱한다. 파싱한 뒤에는
`GeneratedSuggestion`(dataclass)으로 바꿔 워크플로 안에서는 이 스키마를 쓰지 않는다.
"""

from pydantic import BaseModel, Field

from app.features.suggestions.workflow.state import GeneratedSuggestion


class SuggestionDraft(BaseModel):
    """음식 추천 하나의 초안."""

    what_to_try: str = Field(description="아이에게 시도해 볼 음식 하나의 이름.")
    why_this_may_help: str = Field(description="이 음식이 아이에게 도움이 될 것이라 본 이유.")
    ingredients: list[str] = Field(
        description=(
            "추천한 음식에 들어가는 재료를 빠짐없이 모두. "
            "쓸 수 있는 재료 목록의 이름 그대로 적는다."
        )
    )
    preparation_method: str = Field(
        description="편식을 덜기 위해 이 음식을 제공할 때 고려할 조리·손질·크기·제공 방식."
    )


class SuggestionsDraft(BaseModel):
    """음식 추천 초안 묶음."""

    suggestions: list[SuggestionDraft]

    def to_generated(self) -> list[GeneratedSuggestion]:
        return [
            GeneratedSuggestion(
                what_to_try=draft.what_to_try,
                why_this_may_help=draft.why_this_may_help,
                ingredients=tuple(draft.ingredients),
                preparation_method=draft.preparation_method,
            )
            for draft in self.suggestions
        ]
