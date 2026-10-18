<!-- AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim -->

# server

백엔드 API — FastAPI + Postgres.

## 문서 안내

| 알고 싶은 것 | 문서 |
|---|---|
| 디렉토리 구조, 설치 · 실행 · 테스트, 작업 규칙, 컨벤션 | 이 문서 |
| 아키텍처 (구조의 의도 · 설계 근거 · 코드 배치 규칙 · 에러 처리 · 새 기능 추가 · 버전 관리 전략) | [`docs/architecture.md`](docs/architecture.md) |
| 배포 (CI/CD 흐름 · 운영 환경변수 · 서버 접속과 로그 · 배포 실패 대응) | [`docs/deploy.md`](docs/deploy.md) |
| LLM(AI 코딩 도구)이 특히 지켜야 할 규칙 | [`AGENTS.md`](AGENTS.md) |
| API 명세 (서버 실행 후) | http://localhost:8000/docs |
| 환경변수 목록 | [`.env.example`](.env.example) |

## 시작하기

**패키지 관리는 [uv](https://docs.astral.sh/uv/getting-started/installation/)를 사용한다.**
`pip`로 설치하지 않는다. 의존성을 추가 · 제거할 때는 `uv add` / `uv remove`를 사용한다.

```bash
uv sync                                  # 의존성 설치 (.venv 자동 생성)
cp .env.example .env                     # 환경변수 준비 (local 이외 환경은 JWT_SECRET_KEY 교체)
docker compose up -d                     # 로컬 Postgres 기동
uv run alembic upgrade head              # DB 마이그레이션
uv run uvicorn app.main:app --reload     # 서버 실행 → http://localhost:8000/docs
```

| 작업 | 명령어 |
|---|---|
| 테스트 (인메모리 SQLite, Postgres 불필요) | `uv run pytest` |
| 린트 / 포맷 | `uv run ruff check .` / `uv run ruff format .` |
| 의존성 추가 / 제거 | `uv add <package>` / `uv remove <package>` (dev 는 `--dev`) |
| 마이그레이션 생성 | `uv run alembic revision --autogenerate -m "설명"` |
| 마이그레이션 적용 / 되돌리기 | `uv run alembic upgrade head` / `uv run alembic downgrade -1` |

## 코드 품질 기준

코드 품질은 아래 두 가지를 순서대로 우선한다.

1. **단일 책임 원칙.** 파일 · 클래스 · 함수는 하나의 역할만 맡고, 하나의 이유로만 바뀐다.
2. **사람이 이해하고 유지보수할 수 있는가.** 개별 파일 · 클래스 · 함수가 역할별로 잘 나뉘어 있어,
   이름만 보고 역할을 예측하고 이해할 수 있어야 하고, 쉽게 수정할 수 있어야 한다.

## 디렉토리 구조

각 영역의 의도와 설계 근거는 [`docs/architecture.md`](docs/architecture.md)를 참고한다.

```
server/
├── pyproject.toml            # 의존성 + 도구 설정 (uv, ruff, pytest)
├── .env.example              # 환경변수 템플릿 (.env 는 git 제외)
├── docker-compose.yml        # 로컬 Postgres
├── Dockerfile                # 운영 배포용 이미지
├── .dockerignore             # 이미지에서 제외할 파일 (.env 등)
├── deploy/
│   └── deploy.sh             # EC2 에서 실행되는 배포 스크립트 (GitHub Actions 가 SSM 으로 전달)
├── alembic.ini               # 마이그레이션 설정 (DB URL 은 env.py 가 주입)
├── README.md                 # (이 문서)
├── AGENTS.md                 # LLM 전용 규칙
├── docs/
│   ├── architecture.md       # 아키텍처
│   └── deploy.md             # 배포
├── migrations/               # Alembic (async)
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 20261010_0000_create_users.py   # 파일명: 날짜_시분_slug (alembic.ini file_template)
├── app/
│   ├── main.py               # FastAPI 앱 팩토리 + /health
│   ├── api/                  # ── 앱 전체 HTTP 공통 ──
│   │   ├── errors.py         #   에러 응답 모양, @error_specs, ErrorMappedRoute, 공통 핸들러
│   │   └── v1.py             #   기능별 라우터를 /api/v1 로 집약
│   ├── core/                 # ── 횡단 관심사 (비즈니스 지식 없음) ──
│   │   ├── config.py         #   pydantic-settings 설정 (싱글턴)
│   │   ├── database.py       #   async 엔진/세션, DeclarativeBase, get_session
│   │   ├── timezone.py       #   KST 현재 시각(now_kst)
│   │   └── errors.py         #   AppError (HTTP 를 모르는 에러 베이스)
│   ├── models/               # ── DB 테이블 정의 ──
│   │   ├── __init__.py       #   모든 모델 import (메타데이터 등록)
│   │   └── user.py           #   User (users 테이블)
│   └── features/             # ── 기능별 코드 ──
│       └── auth/             #   회원가입 · 로그인 · 내 정보
│           ├── router.py     #   엔드포인트 + 요청/응답 DTO + 에러 응답 선언
│           ├── service.py    #   비즈니스 로직 (DB 조회/저장 포함) + 이 기능의 에러
│           ├── dependencies.py   # CurrentUser (로그인한 사용자) — 다른 기능도 가져다 쓴다
│           └── security.py   #   비밀번호 해싱(argon2) + JWT(PyJWT)
└── tests/
    ├── conftest.py           # 인메모리 SQLite + get_session 오버라이드
    ├── test_auth.py          # 가입/로그인/내 정보 happy-path + 에러 케이스
    ├── test_core.py          # 헬스체크 · 설정 검증 · KST
    └── test_errors.py        # 에러 응답 처리 + /docs 문서 생성
```

## 용어 설명

이 프로젝트의 문서와 코드에 자주 나오는 말이다. 코드의 예시는 `app/features/auth/`에서 볼 수 있다.

| 용어 | 뜻 | 이 프로젝트에서 |
|---|---|---|
| **엔드포인트** | 클라이언트가 호출하는 API 하나. URL과 HTTP 메서드의 짝이다 | `POST /api/v1/auth/signup` |
| **라우터** (`router.py`) | 엔드포인트를 정의하는 파일. 요청을 받아 서비스를 부르고, 결과를 응답으로 돌려준다 | `features/auth/router.py` |
| **서비스** (`service.py`) | 비즈니스 로직을 작성하는 파일. "이미 가입된 이메일이면 가입할 수 없다" 같은 규칙과 DB 조회/저장 코드가 여기에 있다 | `features/auth/service.py`의 `AuthService` |
| **모델** (`models/`) | DB 테이블의 구조를 정의한 클래스. 클래스 하나가 테이블 하나다 | `models/user.py`의 `User` = `users` 테이블 |
| **DTO** | 클라이언트와 주고받는 JSON의 모양을 정의한 클래스. Pydantic이라는 라이브러리(데이터의 모양을 클래스로 정의하고 값이 맞는지 검사해 주는 도구)로 만든다. 요청 DTO는 받은 값이 올바른지 검사하고, 응답 DTO는 돌려줄 필드만 담는다 | `SignUpRequest`, `UserResponse` |
| **의존성** (`Depends`) | 엔드포인트가 실행되기 전에 FastAPI가 대신 실행해서 결과를 인자로 넣어 주는 함수 | `CurrentUser` (로그인한 사용자), `get_session` |
| **세션 · 트랜잭션** | 세션은 DB와 대화하는 창구, 트랜잭션은 "전부 성공하거나 전부 취소"로 묶인 DB 작업 단위 | 요청 하나가 트랜잭션 하나. 성공하면 저장(commit), 에러가 나면 되돌린다(rollback) |
| **마이그레이션** | DB 테이블 구조의 변경 이력을 파일로 관리하는 것 (Alembic) | `migrations/versions/` |

## 새 기능 추가하기

새 기능(예: 식사 기록 `meal_logs`)을 추가하는 순서다. 모든 단계의 예시는 `features/auth/`에서 볼 수 있다.

1. **모델 만들기.** `app/models/meal_log.py`에 테이블 구조를 정의하고, `app/models/__init__.py`에 import를
   추가한다. 모든 테이블에 `created_at` / `updated_at`을 두고, `ForeignKey`에는
   `onupdate="CASCADE", ondelete="CASCADE"`를 붙인다 (아래 컨벤션 참고).
2. **마이그레이션 만들기.** `uv run alembic revision --autogenerate -m "식사 기록 테이블 추가"`로 변경 이력
   파일을 만들고, 만들어진 파일의 내용을 확인한다. DB에 적용(`uv run alembic upgrade head`)하는 것은
   DB가 바뀌는 작업이므로 팀원과 확인한 뒤에 한다.
3. **서비스 만들기.** `app/features/meal_logs/service.py`에 비즈니스 로직을 작성한다. DB 조회/저장 코드도
   여기에 쓴다. 일이 잘못되면 에러 클래스를 만들어 던진다 (에러 처리 컨벤션 참고).
4. **라우터 만들기.** `app/features/meal_logs/router.py`에 요청/응답 DTO, 엔드포인트, 에러 응답 선언을
   작성한다. 라우터는 `route_class=ErrorMappedRoute`로 만든다.

   ```python
   router = APIRouter(prefix="/meal-logs", tags=["meal-logs"], route_class=ErrorMappedRoute)
   ```

5. **등록하기.** `app/api/v1.py`에서 `api_v1_router.include_router(...)`로 새 라우터를 등록한다.
6. **테스트 쓰기.** `tests/test_meal_logs.py`에 정상 동작과 주요 에러 케이스를 추가하고,
   `uv run pytest`와 `uv run ruff check .`가 통과하는지 확인한다.

## 에러 처리

API가 실패할 때(예: 이미 가입된 이메일로 가입 시도) 클라이언트에게 어떤 응답을 줄지 정하는 규칙이다.
설계 근거와 동작 원리는 [`docs/architecture.md`](docs/architecture.md)의 에러 처리 절을 참고한다.

### 에러 응답 모양

모든 에러 응답의 본문은 같은 모양이다. 상태 코드(409 등)는 HTTP 응답의 상태로 전달되고 본문에는 넣지 않는다.

```json
{"error_code": "EMAIL_ALREADY_EXISTS", "details": {"email": "a@b.com"}}
```

- `error_code`: 에러의 종류를 나타내는 이름. 클라이언트가 이 값을 보고 어떻게 처리할지, 화면에 어떤 문구를
  보여줄지 정한다. 서버는 화면에 보여줄 문구를 보내지 않는다. 대문자와 밑줄(`SNAKE_CASE`)로 쓴다.
- `details`: 클라이언트에게 알려 줄 추가 정보. 없으면 `{}`다.

### 새 에러를 추가하는 방법

일이 잘못되는 곳(서비스)은 "무슨 일이 생겼는지"만 알리고, 그것을 어떤 응답으로 내보낼지는 라우터가 정한다.

**1. `service.py`에서 에러 클래스를 만들어 던진다.** 에러 클래스는 `AppError`를 상속한다. 응답에 실을 내용은
속성으로 보관한다.

```python
class EmailAlreadyExistsError(AppError):
    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


# AuthService.sign_up 안에서
raise EmailAlreadyExistsError(email)
```

**2. `router.py`에서 그 에러를 어떤 응답으로 내보낼지 선언한다.** 에러 클래스마다 상태 코드(`status_code`),
`error_code`, `details`를 정한다. 엔드포인트에 `@error_specs`로 붙인다.

```python
SIGN_UP_ERRORS = {
    EmailAlreadyExistsError: ErrorSpec(
        status_code=409,
        error_code="EMAIL_ALREADY_EXISTS",
        details=lambda e: {"email": e.email},
    ),
}


@router.post("/signup")
@error_specs(SIGN_UP_ERRORS)
async def sign_up(...): ...
```

위 선언은 "이 엔드포인트에서 `EmailAlreadyExistsError`가 발생하면 409 상태 코드와 `EMAIL_ALREADY_EXISTS`
코드로 응답한다"는 뜻이다. `/docs`(API 문서)에도 이 응답이 자동으로 표시된다.

### 지킬 것

- 에러 클래스에는 상태 코드와 자연어 메시지를 넣지 않는다. 클래스 이름과 속성만 둔다.
- 선언하지 않은 에러가 발생하면 500 `INTERNAL_ERROR`로 응답하고 로그에 남는다. 서버의 실수로 취급하므로,
  새 에러를 만들면 반드시 라우터에서 선언한다.
- 새 라우터는 `APIRouter(route_class=ErrorMappedRoute)`로 만든다. 빠뜨리면 선언이 적용되지 않는다
  (테스트가 검사한다).
- 비밀번호 같은 비밀값은 `details`에 싣지 않는다.
- 로그인이 필요한 엔드포인트의 "로그인하지 않음" 에러(401 `UNAUTHENTICATED`)는 `CurrentUser`가 알아서 처리하므로
  따로 선언하지 않는다.

## 요청 값 검증

클라이언트가 보낸 값이 올바른지 검사하는 규칙이다. 검사는 엔드포인트가 실행되기 전에 요청 DTO에서 일어난다.

**Pydantic이 자동으로 검사하는 것.** 필수 필드가 없거나 타입이 다르면(예: 숫자 자리에 문자열) Pydantic이
알아서 거절한다. 이 경우 422 상태 코드와 `VALIDATION_ERROR`로 응답하고, `details.fields`에 어디가 틀렸는지
(`loc`)와 어떻게 틀렸는지(`type`)가 담긴다. 따로 코드를 쓸 필요가 없다.

**클라이언트가 종류를 구분해야 하는 규칙은 `field_validator`로 직접 검사한다.** 길이나 형식처럼 "무엇이
틀렸는지"를 `error_code`로 알려야 하는 규칙은 `Field(min_length=...)` 같은 Pydantic의 기본 제약을 쓰지 않는다.
기본 제약이 거절하면 모두 `VALIDATION_ERROR`로 뭉뚱그려져 클라이언트가 이유를 구분할 수 없기 때문이다.
`field_validator`는 Pydantic이 값을 받을 때 실행해 주는 검사 함수이고, 여기서 우리 에러 클래스를 던진다.

```python
class FullNameLengthError(AppError):
    def __init__(self, full_name: str) -> None:
        super().__init__()
        self.full_name = full_name


class SignUpRequest(BaseModel):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, value: str) -> str:
        if not 1 <= len(value) <= 100:
            raise FullNameLengthError(value)
        return value
```

던진 에러는 서비스에서 던진 에러와 똑같이 `router.py`에서 `@error_specs`로 응답을 선언한다.
요청 값이 틀린 경우의 상태 코드는 422를 쓴다.

```python
FullNameLengthError: ErrorSpec(
    status_code=422,
    error_code="INVALID_FULL_NAME_LENGTH",
    details=lambda e: {"input": e.full_name},
),
```

**지킬 것**

- 값 자체만 보고 판단할 수 있는 규칙(길이, 형식)만 `field_validator`에 둔다. DB를 조회해야 알 수 있는
  규칙(예: 이미 가입된 이메일)은 서비스에서 검사하고 에러를 던진다.
- 이메일 형식처럼 Pydantic이 이미 가진 검사 도구(`EmailStr`)를 쓰고 싶으면 `TypeAdapter(EmailStr)`로 검사하고,
  실패하면 우리 에러로 바꿔 던진다 (`features/auth/router.py`의 `_check_email` 참고).
- 비밀번호처럼 되돌려 주면 안 되는 값은 에러의 `details`에 싣지 않는다.

## 로그인한 사용자 받기

로그인이 필요한 엔드포인트는 "이 요청을 누가 보냈는가"를 알아야 한다. 이것은 서비스가 아니라 **라우터가
`CurrentUser`를 인자로 받아서** 해결한다. `CurrentUser`는 `features/auth/dependencies.py`에 있고, 어떤 기능의
`router.py`에서든 가져다 쓸 수 있다.

```python
from app.features.auth.dependencies import CurrentUser


@router.get("/meal-logs")
async def list_meal_logs(
    current_user: CurrentUser,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> list[MealLogResponse]:
    logs = await service.list_for_user(user=current_user)
    ...
```

동작은 이렇다.

1. 클라이언트는 로그인으로 받은 `access_token`을 `Authorization: Bearer <토큰>` 헤더에 담아 보낸다.
2. 엔드포인트가 실행되기 전에 FastAPI가 토큰을 검사한다. 위조되었거나 만료되었거나 `refresh_token`이면
   401 `UNAUTHENTICATED`로 응답하고 엔드포인트는 실행되지 않는다.
3. 올바르면 토큰의 사용자(`User`)가 `current_user`로 들어온다.

**지킬 것**

- 서비스에는 토큰이 아니라 `current_user`(또는 필요한 값인 `user_id`)를 넘긴다. 서비스는 토큰이
  무엇인지 몰라야 한다.
- 로그인하지 않았을 때의 401 응답은 `CurrentUser`가 이미 선언을 갖고 있어서 엔드포인트에 따로 쓰지 않는다.
- 토큰을 직접 해석하지 않는다. 반드시 `CurrentUser`를 받는다.
- 로그인 없이 호출할 수 있는 엔드포인트(회원가입, 로그인)는 `CurrentUser`를 받지 않는다.

## 기능 간 규칙

기능(`features/` 아래 폴더) 하나가 다른 기능을 쓸 때 지킬 규칙이다. 기능끼리 얽히면 한 곳을 고칠 때 어디가
깨지는지 알기 어려워지므로, 의존하는 방향을 한쪽으로 제한한다.

**다른 기능의 `service.py`는 호출하지 않는다.** 서비스끼리 서로 부르기 시작하면 어떤 기능이 어떤 기능의
데이터를 바꾸는지 따라가기 어렵다. 다른 기능의 로직을 재사용하고 싶으면 그 로직을 `service.py` 밖의 함수
모듈(예: `queries.py`)로 분리하고, 원래 기능의 `service.py`와 그것을 쓰려는 다른 기능의 `service.py`가 **둘 다
그 모듈을 import**한다. 분리한 모듈은 그 로직을 주로 쓰는 기능 폴더에 둔다.

**다른 기능에서 import해도 되는 것**
- `models/`의 모델 (읽기 용도). 예: 추천 기능이 식사 기록을 조회하려고 `MealLog`를 import한다.
- 다른 기능이 공개한 `dependencies.py` (예: `auth`의 `CurrentUser`)
- 위에서 분리한 함수 모듈

**기능끼리 서로 import하는 순환은 만들지 않는다.** A가 B를 쓰면 B는 A를 쓰지 않는다.

**다른 기능의 테이블을 참조할 때**
- ID 컬럼과 `ForeignKey("테이블.id", ...)`로만 가리킨다. `ForeignKey`는 테이블 이름을 문자열로 적으므로 그 기능의
  파일을 import하지 않아도 된다.
- 기능 사이에는 SQLAlchemy `relationship`을 걸지 않는다. 필요하면 ID로 직접 조회한다.
- 두 테이블이 서로 가리킬 때는 `ForeignKey`를 한쪽에만 건다. 양쪽에 걸면 마이그레이션이 꼬인다.

**여러 기능의 데이터를 합친 화면**(홈 화면 등)은 조합 전용 기능(예: `features/home/`)을 만든다. 그
기능의 `service.py`가 각 기능에서 분리된 함수 모듈을 호출해 조합한다.

## 배포

`main`에 `server/` 변경이 머지되면 GitHub Actions가 Docker 이미지를 만들어 AWS EC2에 자동으로 배포한다.
DB는 AWS RDS의 PostgreSQL이다. 자세한 흐름 · 운영 방법은 [`docs/deploy.md`](docs/deploy.md)를 참고한다.

- **PR에서는 CI가 검사한다.** `ruff check`, `ruff format --check`, `pytest`가 통과해야 한다.
  PR 전에 `server/`에서 같은 명령을 실행하면 결과를 미리 알 수 있다.
- **마이그레이션은 배포할 때 자동으로 적용된다.** 이미 적용된 마이그레이션은 서버를 이전 버전으로 되돌려도
  되돌아가지 않는다. 컬럼 삭제처럼 되돌리기 어려운 변경은 두 번에 나누어 배포해야 한다.
- **운영 환경변수는 AWS SSM Parameter Store(`/nurturebites/prod/*`)에 있다.** 로컬은 `.env`, 테스트는 설정이
  필요 없다. 새 환경변수를 추가하면 `.env.example`에 적어야 하고, PR을 머지하기 **전에** Parameter Store에 같은
  이름으로 등록해야 한다. 값을 바꾼 뒤에는 Actions 탭에서 Server Deploy를 수동 실행해야 반영된다.
- **`Dockerfile`을 고쳤다면** CI는 이미지를 빌드하지 않으므로, 로컬에서 `docker build server`로 빌드가 되는지
  확인해야 한다.
- 비밀 값(DB 비밀번호, JWT 키)은 GitHub나 코드에 두지 않는다.

## 작업 규칙

- **테스트 갱신 필수**: 새 엔드포인트/유스케이스를 추가하면 happy-path + 주요 에러 케이스 테스트를
  추가한다. 기존 동작(요청/응답 DTO, 도메인 규칙, 상태 코드 등)을 바꾸면 관련 테스트를 같이 수정한다.
- 커밋/PR 전 `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .`가 **전부 통과**해야 한다
  (PR에서 CI가 같은 세 가지를 실행한다). 테스트 없는 기능 변경은 미완료다.
  깨진 테스트를 지우거나 약화해서 통과시키지 않는다.
- 아키텍처 관련 작업(폴더 구조, 의존성 방향, 새 기능 추가, 에러 처리, API 버전)은 먼저
  [`docs/architecture.md`](docs/architecture.md)를 따른다.
- 브랜치 · 커밋 · PR 규칙은 저장소 루트의 `GIT_WORKFLOW.md`를 따른다.

## 컨벤션

- 모든 DB 테이블 모델에 `created_at` / `updated_at`을 둔다
  (`DateTime(timezone=True)`, `default=now_kst`, `onupdate=now_kst`).
- 모든 `ForeignKey`에 `onupdate="CASCADE", ondelete="CASCADE"`를 지정한다.
- DB 스키마 변경은 Alembic 리비전(`migrations/versions/`)으로 관리한다. 파일명은
  `날짜_시분_slug.py`이며 `alembic.ini`의 `file_template`이 자동 적용한다.
- 키가 여러 개인 복잡한 `dict`를 반환하거나 주고받을 때는 가급적 `dataclass`를
  쓰길 권장한다. 필드 이름과 타입이 코드에 드러나 IDE 자동완성을 쓸 수 있고, 키 오타를 코드를 읽거나 작성하는
  단계에서 알아채기 쉽다. API 요청/응답 모양은 지금처럼 Pydantic DTO를 쓴다.
- 에러 처리는 위의 [에러 처리](#에러-처리) 절을 따른다.
- 비밀번호는 평문 저장·응답 금지(argon2 해시). 토큰 subject는 `str(user.id)`.
- 비밀값은 코드에 하드코딩하지 않는다. 설정은 `core/config.py` + `.env`로 읽고, `.env`는 커밋하지 않는다.
  local 이외 환경에서 기본 `JWT_SECRET_KEY`면 서버 기동이 실패한다.
