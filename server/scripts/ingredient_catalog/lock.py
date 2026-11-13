# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 재료 적재·백업·복구의 동시 실행 잠금

"""공용 목록을 읽거나 교체하는 관리 명령은 같은 트랜잭션 잠금을 사용한다."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def lock_catalog(session: AsyncSession) -> None:
    if session.get_bind().dialect.name == "postgresql":
        await session.execute(text("SELECT pg_advisory_xact_lock(726814303991)"))
