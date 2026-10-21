# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""인증 HTTP 라우터: /auth/signup, /auth/login.

요청/응답 DTO(v1 클라이언트 계약)와, 서비스 에러를 어떤 응답으로 포장할지(`@error_specs`)를
이 파일에서 정한다. DTO 가 여러 기능에서 재사용되거나 길어지면 dto.py 로 분리한다.
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    TypeAdapter,
    ValidationError,
    field_validator,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import ErrorMappedRoute, ErrorSpec, error_specs
from app.core.config import get_settings
from app.core.database import get_session
from app.core.errors import AppError
from app.features.auth.dependencies import CurrentUser
from app.features.auth.service import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidEmailCodeError,
    SameEmailError,
)

router = APIRouter(prefix="/auth", tags=["auth"], route_class=ErrorMappedRoute)


# ── 요청 검증 에러 (SignUpRequest 의 검증기가 던진다) ──

_EMAIL_MAX_LENGTH = 255
_PASSWORD_MIN_LENGTH = 8
_PASSWORD_MAX_LENGTH = 128
_FULL_NAME_MIN_LENGTH = 1
_FULL_NAME_MAX_LENGTH = 100

# 이메일 형식 판정에만 Pydantic 의 EmailStr 을 빌려 쓰고, 실패는 우리 에러로 바꿔 던진다.
_email_adapter = TypeAdapter(EmailStr)


class InvalidEmailError(AppError):
    """이메일 형식이 올바르지 않다."""

    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


class PasswordLengthError(AppError):
    """비밀번호 길이가 허용 범위를 벗어났다. 비밀번호는 응답에 되돌려 주지 않는다."""


class FullNameLengthError(AppError):
    """이름 길이가 허용 범위를 벗어났다."""

    def __init__(self, full_name: str) -> None:
        super().__init__()
        self.full_name = full_name


# ── DTO ─────────────────────────────────────────────


class SignUpRequest(BaseModel):
    """회원가입 요청. 값 검증은 Pydantic 기본 제약 대신 우리 에러를 던지는 검증기로 한다."""

    email: str
    password: str
    full_name: str

    @field_validator("email")
    @classmethod
    def _check_email(cls, value: str) -> str:
        if len(value) > _EMAIL_MAX_LENGTH:
            raise InvalidEmailError(value)
        try:
            return _email_adapter.validate_python(value)
        except ValidationError:
            raise InvalidEmailError(value) from None

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        if not _PASSWORD_MIN_LENGTH <= len(value) <= _PASSWORD_MAX_LENGTH:
            raise PasswordLengthError()
        return value

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, value: str) -> str:
        if not value.strip() or not _FULL_NAME_MIN_LENGTH <= len(value) <= _FULL_NAME_MAX_LENGTH:
            raise FullNameLengthError(value)
        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def _stringify_id(cls, value: int) -> str:
        return str(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UpdateNameRequest(BaseModel):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, value: str) -> str:
        if not value.strip() or not _FULL_NAME_MIN_LENGTH <= len(value) <= _FULL_NAME_MAX_LENGTH:
            raise FullNameLengthError(value)
        return value


class EmailChangeRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _check_email(cls, value: str) -> str:
        if len(value) > _EMAIL_MAX_LENGTH:
            raise InvalidEmailError(value)
        try:
            return _email_adapter.validate_python(value)
        except ValidationError:
            raise InvalidEmailError(value) from None


class ConfirmEmailChangeRequest(EmailChangeRequest):
    code: str

    @field_validator("code")
    @classmethod
    def _check_code(cls, value: str) -> str:
        if len(value) != 6 or not value.isdigit():
            raise InvalidEmailCodeError()
        return value


class EmailChangeSentResponse(BaseModel):
    sent: bool = True
    # local 에서만 채워진다. 운영 응답에는 코드를 넣지 않는다.
    dev_code: str | None = None


# ── 의존성 ──────────────────────────────────────────


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuthService:
    return AuthService(session)


# ── 에러 포장 ───────────────────────────────────────

SIGN_UP_ERRORS = {
    InvalidEmailError: ErrorSpec(
        status_code=422,
        error_code="INVALID_EMAIL",
        details=lambda e: {"input": e.email},
    ),
    PasswordLengthError: ErrorSpec(status_code=422, error_code="INVALID_PASSWORD_LENGTH"),
    FullNameLengthError: ErrorSpec(
        status_code=422,
        error_code="INVALID_FULL_NAME_LENGTH",
        details=lambda e: {"input": e.full_name},
    ),
    EmailAlreadyExistsError: ErrorSpec(
        status_code=409,
        error_code="EMAIL_ALREADY_EXISTS",
        details=lambda e: {"email": e.email},
    ),
}

LOGIN_ERRORS = {
    InvalidCredentialsError: ErrorSpec(status_code=401, error_code="INVALID_CREDENTIALS"),
}

UPDATE_NAME_ERRORS = {
    FullNameLengthError: ErrorSpec(
        status_code=422,
        error_code="INVALID_FULL_NAME_LENGTH",
        details=lambda e: {"input": e.full_name},
    ),
}

EMAIL_CHANGE_ERRORS = {
    InvalidEmailError: ErrorSpec(
        status_code=422,
        error_code="INVALID_EMAIL",
        details=lambda e: {"input": e.email},
    ),
    SameEmailError: ErrorSpec(
        status_code=422,
        error_code="SAME_EMAIL",
        details=lambda e: {"email": e.email},
    ),
    EmailAlreadyExistsError: ErrorSpec(
        status_code=409,
        error_code="EMAIL_ALREADY_EXISTS",
        details=lambda e: {"email": e.email},
    ),
    InvalidEmailCodeError: ErrorSpec(status_code=400, error_code="INVALID_EMAIL_CODE"),
}


# ── 엔드포인트 ──────────────────────────────────────


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
@error_specs(SIGN_UP_ERRORS)
async def sign_up(
    payload: SignUpRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserResponse:
    user = await service.sign_up(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
    )
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="로그인 (JWT 발급)",
)
@error_specs(LOGIN_ERRORS)
async def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    tokens = await service.login(email=payload.email, password=payload.password)
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="내 정보 조회 (로그인 필요)",
)
async def read_me(current_user: CurrentUser) -> UserResponse:
    # current_user 는 FastAPI 가 토큰을 검증해 넣어 준다 (features/auth/dependencies.py).
    # 로그인하지 않은 경우의 401 응답 선언은 get_current_user 가 들고 있어 여기서 적지 않는다.
    return UserResponse.model_validate(current_user)


# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
@router.patch(
    "/me",
    response_model=UserResponse,
    summary="내 이름 수정",
)
@error_specs(UPDATE_NAME_ERRORS)
async def update_me(
    payload: UpdateNameRequest,
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserResponse:
    user = await service.update_full_name(current_user, full_name=payload.full_name)
    return UserResponse.model_validate(user)


@router.post(
    "/email-change",
    response_model=EmailChangeSentResponse,
    response_model_exclude_none=True,
    summary="이메일 변경 코드 발급",
)
@error_specs(EMAIL_CHANGE_ERRORS)
async def request_email_change(
    payload: EmailChangeRequest,
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> EmailChangeSentResponse:
    # AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
    code = await service.request_email_change(current_user, email=payload.email)
    if get_settings().ENVIRONMENT == "local":
        return EmailChangeSentResponse(dev_code=code)
    return EmailChangeSentResponse()


@router.post(
    "/email-change/confirm",
    response_model=UserResponse,
    summary="이메일 변경 코드 확인",
)
@error_specs(EMAIL_CHANGE_ERRORS)
async def confirm_email_change(
    payload: ConfirmEmailChangeRequest,
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserResponse:
    user = await service.confirm_email_change(current_user, email=payload.email, code=payload.code)
    return UserResponse.model_validate(user)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="계정 삭제",
)
async def delete_me(
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    await service.delete_account(current_user)
