# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""제안 워크플로가 쓰는 채팅 모델 생성.

이 기능만 쓰는 LLM 클라이언트이므로 `core/`가 아니라 기능 폴더에 둔다.
다른 기능이 LLM을 쓰게 되면 그때 `core/`로 올린다.
"""

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.core.config import Settings, get_settings


def build_chat_model(settings: Settings | None = None) -> BaseChatModel:
    """설정에서 모델 이름과 API 키를 읽어 채팅 모델을 만든다.

    테스트에서는 이 함수를 쓰지 않고 가짜 모델을 `build_graph`에 직접 넘긴다.
    """
    settings = settings or get_settings()
    # OpenAI는 도구(함수) 호출에 Responses API를 권장한다. Chat Completions는 reasoning_effort가
    # none일 때만 도구 호출을 지원하므로, 라이브러리 기본값에 기대지 않고 명시한다.
    return ChatOpenAI(
        model=settings.SUGGESTION_MODEL,
        api_key=settings.OPENAI_API_KEY,
        use_responses_api=True,
    )
