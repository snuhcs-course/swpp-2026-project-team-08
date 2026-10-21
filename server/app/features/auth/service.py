# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""인증/회원 서비스 (유스케이스) + 이 기능의 에러.

SQLAlchemy 세션으로 `User` 를 직접 조회/저장하고, 비밀번호 해싱과 토큰 발급은
features/auth/security.py 를 사용한다. HTTP 와 DTO 는 모른다: 실패하면 에러 클래스를 던지기만 하고,
그 에러를 어떤 응답으로 포장할지는 router.py 가 정한다.
트랜잭션 커밋은 세션 의존성(get_session)이 담당하므로 여기서는 flush 까지만 한다.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import KST, now_kst
from app.features.auth.codes import issue_email_code
from app.features.auth.queries import delete_user_owned_rows
from app.features.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models import User

_EMAIL_CODE_TTL = timedelta(minutes=10)


# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
def _as_kst(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=KST)
    return value.astimezone(KST)


# ── 에러 ────────────────────────────────────────────


class EmailAlreadyExistsError(AppError):
    """이미 가입된 이메일로 가입을 시도했다."""

    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


class InvalidCredentialsError(AppError):
    """이메일 또는 비밀번호가 올바르지 않다 (둘 중 무엇이 틀렸는지는 구분하지 않는다)."""


class SameEmailError(AppError):
    """바꾸려는 이메일이 현재 이메일과 같다."""

    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


class InvalidEmailCodeError(AppError):
    """이메일 변경 코드가 없거나 만료되었거나 일치하지 않는다."""


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

    async def update_full_name(self, user: User, *, full_name: str) -> User:
        user.full_name = full_name
        await self._session.flush()
        await self._session.refresh(user)
        return user

    # AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
    async def request_email_change(self, user: User, *, email: str) -> str:
        if email.lower() == user.email.lower():
            raise SameEmailError(email)
        existing = await self._find_by_email(email)
        if existing is not None and existing.id != user.id:
            raise EmailAlreadyExistsError(email)
        code = issue_email_code()
        user.pending_email = email
        user.email_change_code_hash = hash_password(code)
        user.email_change_expires_at = now_kst() + _EMAIL_CODE_TTL
        await self._session.flush()
        return code

    async def confirm_email_change(self, user: User, *, email: str, code: str) -> User:
        pending = user.pending_email
        hashed = user.email_change_code_hash
        expires = user.email_change_expires_at
        if (
            pending is None
            or hashed is None
            or expires is None
            or pending.lower() != email.lower()
            or now_kst() > _as_kst(expires)
            or not verify_password(code, hashed)
        ):
            raise InvalidEmailCodeError()
        existing = await self._find_by_email(pending)
        if existing is not None and existing.id != user.id:
            raise EmailAlreadyExistsError(pending)
        user.email = pending
        user.pending_email = None
        user.email_change_code_hash = None
        user.email_change_expires_at = None
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def delete_account(self, user: User) -> None:
        await delete_user_owned_rows(self._session, user.id)
        await self._session.delete(user)
        await self._session.flush()

    async def _find_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()
