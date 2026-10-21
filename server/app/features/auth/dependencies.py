# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""로그인한 사용자를 엔드포인트에 넣어 주는 의존성.

다른 기능의 router.py 도 `CurrentUser` 를 import 해서 쓴다. 엔드포인트 인자로 받으면 FastAPI 가
요청의 `Authorization: Bearer <access_token>` 헤더를 검증하고 로그인한 사용자(`User`)를 넣어 준다.
토큰 해석은 여기서만 하고, service 는 토큰을 모른 채 `User`(또는 `user_id`)를 인자로 받는다.
"""

import re
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorSpec, error_specs
from app.core.database import get_session
from app.core.errors import AppError
from app.features.auth.security import decode_token
from app.models import User

# auto_error=False: 헤더가 없을 때 FastAPI 기본 에러 대신 우리 에러를 던지기 위해서다.
_bearer = HTTPBearer(auto_error=False, description="로그인으로 받은 access_token")


class UnauthenticatedError(AppError):
    """로그인하지 않았거나 토큰이 올바르지 않다."""


@error_specs(
    {UnauthenticatedError: ErrorSpec(status_code=401, error_code="UNAUTHENTICATED")},
)
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    if credentials is None:
        raise UnauthenticatedError()

    try:
        payload = decode_token(credentials.credentials)
        subject = payload["sub"]
        if not isinstance(subject, str) or re.fullmatch(r"[1-9][0-9]*", subject) is None:
            raise ValueError("Invalid user ID")
        user_id = int(subject)
        if user_id > 2**63 - 1:
            raise ValueError("User ID exceeds BIGINT")
    except (jwt.PyJWTError, KeyError, ValueError):
        raise UnauthenticatedError() from None

    # refresh 토큰으로는 API 를 호출할 수 없다.
    if payload.get("type") != "access":
        raise UnauthenticatedError()

    user = await session.get(User, user_id)
    if user is None:
        raise UnauthenticatedError()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
