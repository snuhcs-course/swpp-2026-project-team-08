# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""테스트 픽스처: 인메모리 SQLite + get_session 오버라이드.

실제 Postgres 없이 라우터~서비스~모델 전 계층을 검증한다.
StaticPool 로 단일 커넥션을 공유해 :memory: 스키마가 유지되게 한다.
"""

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# ORM 매핑 등록(테이블 생성에 필요)
import app.models  # noqa: F401
from app.core.database import Base, get_session
from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_session] = _override_get_session

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
        await engine.dispose()


@pytest.fixture(autouse=True)
def forbid_live_llm(monkeypatch):
    def forbidden():
        raise AssertionError("Install ScriptedChatModel; live LLM calls are not allowed")

    monkeypatch.setattr("app.features.suggestions.generator.build_chat_model", forbidden)
