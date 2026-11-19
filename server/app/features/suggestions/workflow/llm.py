# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
# Changed: LangChain LLM 설정
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 가드레일 판정 클라이언트 생성 추가

"""제안 워크플로가 쓰는 채팅 모델 생성.

이 기능만 쓰는 LLM 클라이언트이므로 `core/`가 아니라 기능 폴더에 둔다.
다른 기능이 LLM을 쓰게 되면 그때 `core/`로 올린다. 모델은 OpenRouter를 통해 호출한다.
"""

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openrouter import ChatOpenRouter

from app.core.config import Settings, get_settings
from app.features.suggestions.workflow.jev import JevClient
from app.features.suggestions.workflow.state import RiskJudge


def build_chat_model(settings: Settings | None = None) -> BaseChatModel:
    """설정에서 모델 이름과 API 키를 읽어 채팅 모델을 만든다.

    API 키가 비어 있으면 예외가 난다 (서비스가 `GenerationFailedError`로 바꾼다).
    테스트에서는 이 함수를 쓰지 않고 가짜 모델을 `generate_suggestions`에 직접 넘긴다.
    """
    settings = settings or get_settings()
    return ChatOpenRouter(model=settings.SUGGESTION_MODEL, api_key=settings.OPENROUTER_API_KEY)


def build_judge(settings: Settings | None = None) -> RiskJudge:
    """설정에서 가드레일 판정 모델 이름과 API 키를 읽어 판정 클라이언트를 만든다.

    클라이언트를 만드는 것만으로는 네트워크를 쓰지 않는다. 테스트는 이 함수를 쓰지 않고
    가짜 판정기를 `generate_suggestions`에 직접 넘긴다.
    """
    settings = settings or get_settings()
    return JevClient(settings.OPENROUTER_API_KEY, settings.GUARDRAIL_MODEL)
