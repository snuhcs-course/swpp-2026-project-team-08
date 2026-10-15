# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""에러 -> HTTP 응답 변환.

서비스와 검증기는 `AppError` 하위 클래스를 던지기만 하고, 그 에러를 어떤 응답으로 포장할지는
각 기능의 `router.py` 가 `@error_specs` 로 선언한다. 이 파일은 그 선언을 실행하는 장치다.

- `ErrorSpec`          : 에러 하나의 포장 방식 (status_code, error_code, details)
- `@error_specs`       : 엔드포인트에 `{에러 클래스: ErrorSpec}` 선언을 붙인다
- `ErrorMappedRoute`   : 선언대로 에러를 응답으로 바꾸고 `/docs` 의 responses 를 채운다
                         (서비스 에러와 검증기 에러를 같은 경로로 처리)
- `register_exception_handlers` : 라우트 밖에서 나는 에러(404/405 등)와 선언이 없는 경우의 폴백

모든 에러 응답은 `error_response()` 하나를 거쳐 같은 모양이 된다.
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.dependencies.models import Dependant
from fastapi.dependencies.utils import get_dependant
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import AppError, RequestInvalidError

logger = logging.getLogger(__name__)

_SPECS_ATTR = "__error_specs__"


# ── 응답 모양 ───────────────────────────────────────


class ErrorResponse(BaseModel):
    """모든 에러 응답의 본문 (OpenAPI 문서용 스키마이기도 하다).

    상태 코드는 HTTP 응답 상태로만 나가고 본문에는 넣지 않는다.
    """

    error_code: str
    details: dict[str, Any] = Field(default_factory=dict)


def error_response(status_code: int, error_code: str, details: dict | None = None) -> JSONResponse:
    """에러 응답을 만드는 유일한 함수. 본문은 항상 `ErrorResponse` 모양이다."""
    body = ErrorResponse(error_code=error_code, details=details or {})
    return JSONResponse(status_code=status_code, content=body.model_dump())


# ── 에러 포장 선언 ──────────────────────────────────


@dataclass(frozen=True)
class ErrorSpec:
    """에러 하나를 응답으로 포장하는 방식.

    details 는 에러 인스턴스를 받아 응답의 details 를 만드는 함수다. 생략하면 빈 dict.
    """

    status_code: int
    error_code: str
    details: Callable[[Any], dict] | None = field(default=None)


# 선언하지 않아도 적용되는 기본값. 라우터가 같은 에러를 다시 선언하면 그쪽이 우선한다.
_DEFAULT_SPECS: dict[type[AppError], ErrorSpec] = {
    RequestInvalidError: ErrorSpec(
        status_code=422,
        error_code="VALIDATION_ERROR",
        details=lambda e: {"fields": e.fields},
    ),
}

_UNHANDLED_SPEC = ErrorSpec(status_code=500, error_code="INTERNAL_ERROR")


def error_specs(specs: dict[type[AppError], ErrorSpec]) -> Callable:
    """엔드포인트 함수에 에러 포장 선언을 붙인다. 함수 동작은 바꾸지 않는다.

    `include_router` 는 라우트 객체의 속성을 복사하지 않지만 endpoint 함수는 그대로 보존하므로,
    선언을 함수에 저장한다.
    """

    def decorator(func: Callable) -> Callable:
        setattr(func, _SPECS_ATTR, specs)
        return func

    return decorator


def _pack(exc: AppError, specs: dict[type[AppError], ErrorSpec]) -> JSONResponse:
    """에러를 선언(없으면 기본값)에 따라 응답으로 바꾼다. 가장 가까운 상위 클래스를 찾는다."""
    spec = next(
        (s for cls in type(exc).__mro__ if (s := specs.get(cls) or _DEFAULT_SPECS.get(cls))),
        None,
    )
    if spec is None:
        # 선언이 없는 에러는 어떤 에러인지 알 수 있도록 클래스 이름을 함께 남긴다.
        logger.error("선언되지 않은 AppError: %s", type(exc).__name__)
        spec = _UNHANDLED_SPEC
    details = spec.details(exc) if spec.details else {}
    # 로그는 응답과 같은 내용(error_code, details)으로 남긴다.
    level = logging.ERROR if spec.status_code >= 500 else logging.INFO
    logger.log(level, "error_code=%s details=%s", spec.error_code, details)
    return error_response(spec.status_code, spec.error_code, details)


def _app_error_from(exc: RequestValidationError) -> AppError:
    """검증 실패에서 AppError 를 꺼낸다.

    검증기가 던진 AppError 가 있으면 그것을, 없으면 평범한 검증 실패를
    RequestInvalidError 로 바꾼다.
    """
    errors = exc.errors()
    for err in errors:
        original = err.get("ctx", {}).get("error")
        if isinstance(original, AppError):
            return original
    return RequestInvalidError(
        [{"loc": list(err["loc"]), "type": err["type"]} for err in errors],
    )


# ── 의존성에 붙은 선언 모으기 ───────────────────────


def _collect_specs(dependant: Dependant) -> dict[type[AppError], ErrorSpec]:
    """엔드포인트와 그것이 쓰는 모든 의존성의 `@error_specs` 선언을 합친다.

    의존성이 자기 에러(예: 로그인하지 않음)의 포장을 함께 들고 다니므로, 그 의존성을 쓰는
    엔드포인트마다 같은 선언을 반복하지 않아도 된다. 엔드포인트에 직접 붙인 선언이 우선한다.
    """
    specs: dict[type[AppError], ErrorSpec] = {}
    for sub in dependant.dependencies:
        specs.update(_collect_specs(sub))
    if dependant.call is not None:
        specs.update(getattr(dependant.call, _SPECS_ATTR, {}))
    return specs


# ── /docs 의 responses 자동 생성 ────────────────────


def _docs_for(specs: dict[type[AppError], ErrorSpec]) -> dict[int, dict]:
    """선언을 상태 코드별로 묶어 OpenAPI responses 로 만든다.

    같은 상태 코드에 여러 error_code 가 있으면 설명에 이어 붙인다.
    """
    codes_by_status: dict[int, list[str]] = {}
    for spec in {**_DEFAULT_SPECS, **specs}.values():
        codes = codes_by_status.setdefault(spec.status_code, [])
        if spec.error_code not in codes:
            codes.append(spec.error_code)
    return {
        status: {"model": ErrorResponse, "description": ", ".join(codes)}
        for status, codes in codes_by_status.items()
    }


# ── 라우트 클래스 ───────────────────────────────────


class ErrorMappedRoute(APIRoute):
    """`@error_specs` 선언대로 에러를 응답으로 바꾸는 라우트.

    라우터를 만들 때 `APIRouter(route_class=ErrorMappedRoute)` 로 지정한다.
    Pydantic 검증은 엔드포인트 함수보다 먼저 일어나므로 함수를 감싸는 데코레이터로는 잡을 수
    없다. 라우트 핸들러를 감싸면 검증 실패와 서비스 에러를 한 곳에서 처리할 수 있다.
    """

    def __init__(
        self,
        path: str,
        endpoint: Callable[..., Any],
        *,
        responses: dict | None = None,
        **kwargs: Any,
    ) -> None:
        # 엔드포인트가 쓰는 의존성(예: 로그인 사용자)의 선언도 함께 모은다.
        self.error_specs = _collect_specs(get_dependant(path=path, call=endpoint))
        # 라우터가 직접 지정한 responses 가 자동 생성분보다 우선한다.
        merged_responses = {**_docs_for(self.error_specs), **(responses or {})}
        super().__init__(path, endpoint, responses=merged_responses, **kwargs)

    def get_route_handler(self) -> Callable[[Request], Any]:
        original_handler = super().get_route_handler()
        specs = self.error_specs

        async def handler(request: Request) -> Response:
            try:
                return await original_handler(request)
            except RequestValidationError as exc:
                return _pack(_app_error_from(exc), specs)
            except AppError as exc:
                return _pack(exc, specs)

        return handler


# ── 앱 전체 핸들러 (라우트 밖의 에러 + 폴백) ────────

_HTTP_ERROR_CODES = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}


def register_exception_handlers(app: FastAPI) -> None:
    """`ErrorMappedRoute` 가 처리하지 못하는 에러를 같은 응답 모양으로 포장한다."""

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _pack(_app_error_from(exc), {})

    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return _pack(exc, {})

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        error_code = _HTTP_ERROR_CODES.get(exc.status_code, "HTTP_ERROR")
        return error_response(exc.status_code, error_code)

    @app.exception_handler(Exception)
    async def _unhandled_error(_: Request, exc: Exception) -> JSONResponse:
        logger.error("처리되지 않은 예외", exc_info=exc)
        return error_response(_UNHANDLED_SPEC.status_code, _UNHANDLED_SPEC.error_code)
