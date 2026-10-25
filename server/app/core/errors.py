# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping

"""애플리케이션 공통 에러의 베이스 (HTTP 를 모르는 순수 파이썬).

서비스와 Pydantic 검증기는 에러 클래스를 `raise` 하기만 한다. 상태 코드 · error_code ·
details 로 어떻게 포장할지는 각 기능의 `router.py` 가 정한다 (app/api/errors.py 참고).

`AppError` 가 `ValueError` 를 상속하는 이유: Pydantic `field_validator` 에서 던진 에러가
`ValidationError` 로 변환되도록 하기 위해서다. 원본 에러 객체는 검증 오류의 ctx 에 남는다.
"""


class AppError(ValueError):
    """서비스와 검증기가 던지는 모든 에러의 베이스.

    에러의 의미는 클래스가 나타내므로 자연어 메시지는 두지 않는다. 응답에 실을 내용은
    하위 클래스의 속성으로 보관한다 (예: `self.email`).
    """


class RequestInvalidError(AppError):
    """Pydantic 이 요청을 검증하다 실패한 경우를 정규화한 에러.

    검증기가 던진 `AppError` 가 없는 평범한 검증 실패(필수 필드 누락, 타입 · 길이 위반 등)에
    쓰인다. `fields` 는 틀린 위치와 종류의 목록이다.
    """

    def __init__(self, fields: list[dict]) -> None:
        super().__init__()
        self.fields = fields
