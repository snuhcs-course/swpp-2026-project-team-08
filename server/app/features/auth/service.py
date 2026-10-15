# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""인증/회원 서비스 (유스케이스) + 이 기능의 에러.

SQLAlchemy 세션으로 `User` 를 직접 조회/저장하고, 비밀번호 해싱과 토큰 발급은
features/auth/security.py 를 사용한다. HTTP 와 DTO 는 모른다: 실패하면 에러 클래스를 던지기만 하고,
그 에러를 어떤 응답으로 포장할지는 router.py 가 정한다.
트랜잭션 커밋은 세션 의존성(get_session)이 담당하므로 여기서는 flush 까지만 한다.
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.features.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models import User

# ── 에러 ────────────────────────────────────────────


class EmailAlreadyExistsError(AppError):
    """이미 가입된 이메일로 가입을 시도했다."""

    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


class InvalidCredentialsError(AppError):
    """이메일 또는 비밀번호가 올바르지 않다 (둘 중 무엇이 틀렸는지는 구분하지 않는다)."""


# ── 서비스 ──────────────────────────────────────────


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def sign_up(self, *, email: str, password: str, full_name: str) -> User:
        if await self._find_by_email(email) is not None:
            raise EmailAlreadyExistsError(email)

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def login(self, *, email: str, password: str) -> TokenPair:
        user = await self._find_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            # 사용자 존재 여부를 노출하지 않도록 동일한 에러로 처리한다.
            raise InvalidCredentialsError()

        subject = str(user.id)
        return TokenPair(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    async def _find_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
