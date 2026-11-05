# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 백엔드 레이어별 테스트 작성 예시

from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import database


@pytest.mark.parametrize(
    "failure", [None, "request", "commit"], ids=["정상_완료", "요청_실패", "commit_실패"]
)
async def test_요청_종료_결과에_따라_commit_또는_rollback한다(monkeypatch, failure):
    # 준비: DB 연결은 대체하고 실제 세션 의존성의 트랜잭션 제어를 검사한다.
    session = AsyncMock(spec=AsyncSession)
    context = AsyncMock()
    context.__aenter__.return_value = session
    monkeypatch.setattr(database, "AsyncSessionLocal", Mock(return_value=context))
    error = RuntimeError("저장 실패")
    if failure == "commit":
        session.commit.side_effect = error
    dependency = database.get_session()
    assert await anext(dependency) is session

    # 실행: FastAPI가 yield 뒤로 전달하는 정상 종료·예외를 재현한다.
    if failure == "request":
        with pytest.raises(RuntimeError) as raised:
            await dependency.athrow(error)
        assert raised.value is error
    elif failure == "commit":
        with pytest.raises(RuntimeError) as raised:
            await anext(dependency)
        assert raised.value is error
    else:
        with pytest.raises(StopAsyncIteration):
            await anext(dependency)

    # 검증: 실제 DB rollback에 의한 데이터 보존은 Integration에서 검사한다.
    assert session.commit.await_count == (0 if failure == "request" else 1)
    assert session.rollback.await_count == (1 if failure else 0)
    context.__aexit__.assert_awaited_once()
