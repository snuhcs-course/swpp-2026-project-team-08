# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
# Changed: 식사 기록·로그인 기능 추가
# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 서버 시작 시 .env 의 LangSmith 변수를 환경변수로 내보내도록 lifespan 추가

"""FastAPI 앱 팩토리 / 엔트리포인트.

실행:  uv run uvicorn app.main:app --reload
문서:  http://localhost:8000/docs
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_exception_handlers
from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.tracing import export_tracing_env

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """서버가 시작할 때 `.env`의 LangSmith 변수를 내보내 추적을 켠다.

    테스트는 lifespan 을 실행하지 않으므로 `.env`의 추적 설정이 테스트에 새지 않는다.
    """
    export_tracing_env()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_v1_router)

    @app.get("/health", tags=["meta"], summary="헬스체크")
    async def health() -> dict:
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return app


app = create_app()
