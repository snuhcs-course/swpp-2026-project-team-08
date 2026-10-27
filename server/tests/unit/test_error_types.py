# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Unit: AppError 형식. HTTP나 DB를 실행하지 않는다."""

from app.core.errors import AppError


class NotEnoughStockError(AppError):
    pass


def test_app_errors_carry_no_status_code() -> None:
    # 에러 클래스는 HTTP 를 모른다. 상태 코드는 router 의 ErrorSpec 에만 있다.
    assert not hasattr(NotEnoughStockError, "status_code")
