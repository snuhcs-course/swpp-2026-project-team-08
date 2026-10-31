# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 문자열 목록 컬럼 타입 StringList 추가

"""DB 엔진 / 세션 / 선언적 베이스.

SQLAlchemy 2.0 async 사용.
참고: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
"""

from collections.abc import AsyncGenerator

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """모든 ORM 모델의 베이스. Alembic 의 target_metadata 가 이 metadata 를 본다."""


# 문자열 목록 컬럼 타입. Postgres 에서는 JSONB, 그 외(테스트용 SQLite)에서는 JSON 으로 저장한다.
# 원소 검증은 DB 가 아니라 DTO 와 서비스가 맡는다.
StringList = JSON().with_variant(JSONB, "postgresql")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """요청 단위 세션 의존성.

    트랜잭션 경계를 요청 경계와 일치시킨다: 핸들러가 성공하면 commit,
    예외가 나면 rollback. 서비스는 add/flush 까지만 책임진다.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
