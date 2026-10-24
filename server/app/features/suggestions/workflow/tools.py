# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""LLM이 호출하는 도구.

도구는 읽기 전용이고 DB 세션을 열지 않는다. 아이의 제한 목록은 LLM 인자로 받지 않고
그래프 상태에서 주입받는다 (`InjectedState`는 LLM에게 보이는 인자 스키마에서 빠진다).
새 도구를 만들면 함수를 정의하고 `TOOLS`에 넣는다.
"""

from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from app.features.suggestions.ingredients import Catalog, ChildRestrictions, usable_ingredient_names


@tool
def search_available_ingredients(
    candidates: list[str],
    restrictions: Annotated[ChildRestrictions, InjectedState("restrictions")],
    catalog: Annotated[Catalog, InjectedState("catalog")],
) -> list[str]:
    """이 아이가 쓸 수 있는 재료만 골라서 돌려준다.

    candidates에 확인하고 싶은 재료 이름을 넘기면 그중 쓸 수 있는 재료만 반환한다.
    candidates를 빈 목록으로 부르면 쓸 수 있는 재료 전체를 반환한다.
    반환되지 않은 재료는 이 아이에게 쓸 수 없거나 알 수 없는 재료이므로 제안에 쓰지 않는다.
    """
    return usable_ingredient_names(restrictions, candidates, catalog)


TOOLS = [search_available_ingredients]
