# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""에러 포장 테스트: 서비스/검증기가 던진 AppError 가 router 선언대로 응답으로 바뀌는지.

실제 라우터와 분리하기 위해 이 파일 안에서 작은 앱을 만들어 `ErrorMappedRoute` 를 검증한다.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

import pytest
import pytest_asyncio
from fastapi import APIRouter, Depends, FastAPI
from fastapi.routing import APIRoute
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, field_validator

from app.api.errors import (
    ErrorMappedRoute,
    ErrorSpec,
    error_specs,
    register_exception_handlers,
)
from app.api.v1 import api_v1_router
from app.core.errors import AppError


class NotEnoughStockError(AppError):
    def __init__(self, item: str) -> None:
        super().__init__()
        self.item = item


class BadNameError(AppError):
    """검증기가 던지는 에러."""


class UndeclaredError(AppError):
    """어떤 엔드포인트에서도 포장을 선언하지 않은 에러."""


class OrderRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def _check_name(cls, value: str) -> str:
        if value == "bad":
            raise BadNameError()
        return value


_router = APIRouter(prefix="/orders", route_class=ErrorMappedRoute)


@_router.post("/a")
@error_specs(
    {
        NotEnoughStockError: ErrorSpec(409, "NOT_ENOUGH_STOCK", lambda e: {"item": e.item}),
        BadNameError: ErrorSpec(400, "BAD_NAME"),
    }
)
async def order_a(payload: OrderRequest) -> dict:
    if payload.name == "empty":
        raise NotEnoughStockError("apple")
    if payload.name == "undeclared":
        raise UndeclaredError()
    return {"ok": True}


@_router.post("/b")
@error_specs({BadNameError: ErrorSpec(422, "BAD_NAME_B")})
async def order_b(payload: OrderRequest) -> dict:
    return {"ok": True}


class NeedLoginError(AppError):
    """의존성이 던지는 에러."""


@error_specs({NeedLoginError: ErrorSpec(401, "NEED_LOGIN")})
async def _require_login() -> str:
    raise NeedLoginError()


@_router.get("/c")
async def order_c(user: Annotated[str, Depends(_require_login)]) -> dict:
    # 이 엔드포인트에는 선언이 없지만, 의존성이 들고 있는 선언이 적용된다.
    return {"user": user}


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    test_app = FastAPI()
    register_exception_handlers(test_app)
    test_app.include_router(_router)
    transport = ASGITransport(app=test_app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_service_error_uses_router_spec_with_details(client: AsyncClient) -> None:
    res = await client.post("/orders/a", json={"name": "empty"})

    assert res.status_code == 409
    assert res.json() == {"error_code": "NOT_ENOUGH_STOCK", "details": {"item": "apple"}}


@pytest.mark.asyncio
async def test_validator_error_uses_router_spec(client: AsyncClient) -> None:
    res = await client.post("/orders/a", json={"name": "bad"})

    assert res.status_code == 400
    assert res.json() == {"error_code": "BAD_NAME", "details": {}}


@pytest.mark.asyncio
async def test_same_error_can_have_different_spec_per_endpoint(client: AsyncClient) -> None:
    res = await client.post("/orders/b", json={"name": "bad"})

    assert res.status_code == 422
    assert res.json()["error_code"] == "BAD_NAME_B"


@pytest.mark.asyncio
async def test_undeclared_error_is_500(client: AsyncClient) -> None:
    res = await client.post("/orders/a", json={"name": "undeclared"})

    assert res.status_code == 500
    assert res.json() == {"error_code": "INTERNAL_ERROR", "details": {}}


@pytest.mark.asyncio
async def test_plain_validation_failure_is_normalized(client: AsyncClient) -> None:
    res = await client.post("/orders/a", json={})

    assert res.status_code == 422
    assert res.json() == {
        "error_code": "VALIDATION_ERROR",
        "details": {"fields": [{"loc": ["body", "name"], "type": "missing"}]},
    }


@pytest.mark.asyncio
async def test_openapi_lists_declared_errors_by_status(client: AsyncClient) -> None:
    schema = (await client.get("/openapi.json")).json()
    responses = schema["paths"]["/orders/a"]["post"]["responses"]

    assert responses["409"]["description"] == "NOT_ENOUGH_STOCK"
    assert responses["400"]["description"] == "BAD_NAME"
    assert responses["422"]["description"] == "VALIDATION_ERROR"
    assert responses["409"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ErrorResponse"
    }


@pytest.mark.asyncio
async def test_dependency_carries_its_own_error_spec(client: AsyncClient) -> None:
    res = await client.get("/orders/c")
    schema = (await client.get("/openapi.json")).json()

    assert res.status_code == 401
    assert res.json() == {"error_code": "NEED_LOGIN", "details": {}}
    assert schema["paths"]["/orders/c"]["get"]["responses"]["401"]["description"] == "NEED_LOGIN"


@pytest.mark.asyncio
async def test_unknown_route_has_same_error_shape(client: AsyncClient) -> None:
    res = await client.get("/no-such-path")

    assert res.status_code == 404
    assert res.json() == {"error_code": "NOT_FOUND", "details": {}}


def _api_routes(router: APIRouter) -> list[APIRoute]:
    """include_router 로 감싸진 라우터를 따라 내려가며 모든 APIRoute 를 모은다."""
    found: list[APIRoute] = []
    for route in router.routes:
        if isinstance(route, APIRoute):
            found.append(route)
        elif hasattr(route, "original_router"):
            found.extend(_api_routes(route.original_router))
    return found


def test_every_v1_route_uses_error_mapped_route() -> None:
    # route_class 를 빠뜨린 라우터는 선언된 에러 포장이 적용되지 않으므로 막는다.
    v1_routes = _api_routes(api_v1_router)

    assert v1_routes
    assert all(isinstance(r, ErrorMappedRoute) for r in v1_routes)
