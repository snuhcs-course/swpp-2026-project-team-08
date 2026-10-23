<!-- AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim -->

# server — 아키텍처

> 범위: 백엔드 서버(`server/`)의 **아키텍처** — 구조의 의도 · 영역별 설계와 근거 · 에러 처리 · 코드 배치 규칙 · 버전 관리 전략
> 디렉토리 구조, 설치/실행/테스트 명령어, 작업 규칙은 [`../README.md`](../README.md), LLM 전용 규칙은 [`../AGENTS.md`](../AGENTS.md) 참고

---

## 1. 개요

FastAPI + Postgres 백엔드. 구조의 기준은 **"기능(feature) 단위로 router · service를 두고, 테이블 정의(models)는
한곳에 모은다"**는 것이다.

```
app/
├── features/   # 기능별 router(엔드포인트 · DTO · 에러 포장 선언) + service(유스케이스)
├── models/     # DB 테이블 정의 전부
├── api/        # 앱 전체 HTTP 공통 — 에러 응답 처리, 기능 라우터 집약(/api/v1)
└── core/       # 횡단 기술 관심사 — 설정 · DB 세션 · 에러 베이스 · 시각 (비즈니스 지식 없음)
```

| 영역 | 한 줄 책임 | 바뀌는 이유 |
|---|---|---|
| `features/<기능>/` | 그 기능이 **무엇을 하고 어떻게 노출되는가** | 기능 요구사항 변경 |
| `models/` | **DB에 무엇이 저장되는가** (테이블, 관계) | 스키마 변경 |
| `api/` | 모든 기능이 공유하는 **HTTP 처리 장치** | HTTP 규약 변경 |
| `core/` | 모두가 쓰는 **기술 도구** (설정, DB 세션, 시각) | 인프라/기술 변경 |

## 2. 영역별 상세

### 2.1 기능 (`app/features/<기능>/`)

기능 하나는 폴더 하나다 (예: `auth`). 폴더에는 기본적으로 아래 두 파일을 둔다.

| 파일 | 역할 |
|---|---|
| `router.py` | 외부(클라이언트)에 노출되는 **엔드포인트**(URL)를 정의한다. 요청/응답 DTO, 에러를 어떤 응답으로 내보낼지의 선언(§5)도 여기에 둔다 |
| `service.py` | **비즈니스 로직**을 작성한다. 이 기능이 하는 일(예: 회원가입 시 이메일 중복 확인 후 저장)과 DB 조회/저장 코드도 기본적으로 여기에 정의한다. 이 기능의 에러 클래스도 여기에 둔다 |

**DTO란?** DTO(Data Transfer Object)는 클라이언트와 서버가 주고받는 JSON의 모양을 정의한 클래스다.
이 프로젝트에서는 Pydantic으로 만든다. 요청 DTO(`SignUpRequest`)는 "클라이언트가 이런 JSON을 보내야 한다"는
약속이고, 값이 올바른지 검사한다. 응답 DTO(`UserResponse`)는 "서버가 이런 JSON을 돌려준다"는 약속이고,
돌려줄 필드만 골라 담는다. DB 테이블 모양과 다를 수 있다. 예를 들어 `User` 테이블에는 `hashed_password`가
있지만 `UserResponse`에는 비밀번호 필드가 아예 없어서 응답에 실수로 새지 않는다.

위 두 파일 외에, 각 파일이 길어지거나 기능에 따라 추가 파일이 필요하면 다음 예시와 같이 파일을 더할 수 있다.

<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
| 파일 | 언제 | 역할 |
|---|---|---|
| `dto.py` | DTO가 다른 기능에서 재사용되거나 `router.py`가 길어질 때 | DTO를 `router.py`에서 분리 |
| `exceptions.py` | 에러 클래스가 많아질 때 | 에러를 `service.py`에서 분리 |
| `dependencies.py` | 엔드포인트가 공통으로 받는 값(FastAPI `Depends`)을 만들어 주는 코드가 필요할 때 | 예: `auth/dependencies.py`의 `CurrentUser`(요청을 보낸 로그인 사용자). 다른 기능의 `router.py`도 import해서 쓴다 (§3) |
| `security.py` 등 | 그 기능만 쓰는 기술 도구가 필요할 때 | 예: `auth/security.py`의 비밀번호 암호화 · 토큰 발급 · 검증 |
| `queries.py` | 같은 쿼리를 둘 이상에서 쓰거나 길어질 때 | 평범한 **함수**로 쿼리를 분리 (클래스 · 리포지토리 계층은 두지 않는다) |
| `analysis.py` · `scoring.py` 등 | DB 조회 없이 판단되는 계산 규칙 | **순수 함수** 모듈. 서비스가 데이터를 읽어 넘기고 결과를 저장한다 |
| `workflow/` | LangGraph 같은 다단계 워크플로가 필요할 때 | `state.py · nodes.py · prompts.py · graph.py` 등 (§2.5). LLM이 직접 호출할 도구가 필요하면 `tools.py`를 더할 수 있다 |

**규칙은 service에 둔다.** "이미 가입된 이메일이면 가입할 수 없다" 같은 비즈니스 규칙은 지금은 모두
`service.py`에 작성한다. 규칙을 모델(`models/`)이나 다른 곳에 나눠 두지 않으므로, 규칙을 찾을 때는
`service.py`만 보면 된다. 규칙이 복잡해져 나눌 필요가 생기면 그때 팀이 함께 구조를 정한다.

**service는 HTTP와 DTO를 모른다.** `service.py`는 URL이나 JSON 모양을 알지 못하고, 필요한 값을 평범한
인자로 받는다. 일이 잘못되면 응답을 직접 만들지 않고 에러 클래스를 던지기만 한다 (§5).

**트랜잭션.** 서비스는 `flush`까지만 한다. commit/rollback은 `core/database.py`의 `get_session`이
요청 경계에서 처리한다 (§2.4).

### 2.2 모델 (`app/models/`)

DB 테이블의 구조(어떤 테이블에 어떤 컬럼이 있는가)를 정의하는 곳이다. SQLAlchemy 클래스 하나가 테이블
하나에 대응한다 (`User` 클래스 = `users` 테이블). 비즈니스 규칙은 모델이 아니라 `service.py`에 둔다 (§2.1).

- 파일은 테이블(클래스) 하나당 하나, 단수형 snake_case (`user.py`, `meal_log.py`).
- 새 모델은 `models/__init__.py`에 import해야 `Base.metadata`에 등록된다 (Alembic · 테스트 `create_all`이 필요로 한다).
- 모든 테이블에 `created_at` / `updated_at`, 모든 `ForeignKey`에 `onupdate="CASCADE", ondelete="CASCADE"` (README 컨벤션).

**왜 한곳에 모으나.** 이 앱은 여러 테이블을 가로지르는 읽기가 많다(식사 기록 · 추천 · 재료). 모델이 기능
폴더에 흩어져 있으면 "다른 기능의 모델을 읽어도 되는가"를 매번 따져야 한다. 한곳에 모으면 import 경로가
일정하고(`from app.models import ...`) Alembic도 `app.models` 하나만 import한다. 쓰기의 소유자는
파일 위치가 아니라 규칙으로 지킨다 (§3).

**모델과 DTO는 왜 따로 두나.** 둘 다 "사용자"를 표현하지만 답하는 질문이 다르다.

| | 위치 | 답하는 질문 | 바뀌는 이유 |
|---|---|---|---|
| **모델** | `models/user.py` (`User`) | DB에 어떻게 저장되나 | 테이블 구조 변경 |
| **DTO** | `features/auth/router.py` (`*Request` / `*Response`) | 클라이언트와 어떤 JSON을 주고받나 | API 변경 |

비밀번호가 좋은 예다. 가입 요청(`SignUpRequest.password`)에는 사용자가 입력한 평문이 담기고, DB(`User.hashed_password`)
에는 암호화된 값만 저장되며, 응답(`UserResponse`)에는 비밀번호 필드가 없다. 모델 하나로 합쳐 쓰면 암호화된
값이 응답에 실리거나 평문 비밀번호가 모델에 들어가는 실수가 생기기 쉽다.
(cf. FastAPI [Extra Models](https://fastapi.tiangolo.com/tutorial/extra-models/))

### 2.3 API 공통 (`app/api/`)

기능에 속하지 않는 HTTP 장치만 둔다.

| 파일 | 역할 |
|---|---|
| `errors.py` | 에러 응답 모양(`ErrorResponse`, `error_response`), `ErrorSpec`, `@error_specs`, `ErrorMappedRoute`, 앱 전체 핸들러 (§5) |
| `v1.py` | 각 기능의 라우터를 `/api/v1` 아래로 집약 |

### 2.4 코어 (`app/core/`)

특정 기능을 모르는 횡단 기술 관심사를 담는다.

<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
| 파일 | 역할 |
|---|---|
| `config.py` | pydantic-settings 설정 (싱글턴). `.env`/환경변수 타입 안전 로딩 |
| `database.py` | async 엔진/세션, `DeclarativeBase`, `get_session`(요청 단위 트랜잭션 경계) |
| `timezone.py` | KST 현재 시각 `now_kst` |
| `errors.py` | `AppError`(에러 베이스), `RequestInvalidError` — FastAPI import 없는 순수 파이썬 |
| `llm.py` (필요 시) | 둘 이상의 기능이 LLM을 쓰게 되면 두는 LLM 클라이언트 생성 코드. 비즈니스 지식 없이 설정에서 키를 읽는다. LLM을 쓰는 기능이 하나뿐인 동안은 그 기능의 `workflow/llm.py`에 둔다 (§2.5) |

**무엇이 `core/`에 가나.** 한 기능만 쓰는 코드는 그 기능 폴더에 두고, **둘 이상의 기능이 함께 쓰는 기술 도구**는
`core/`에 둔다 (설정, DB 세션, 시각 등).

**트랜잭션 경계 (`get_session`).** 핸들러가 성공하면 commit, 예외가 나면 rollback한다. 한 요청의 여러 서비스
호출을 한 트랜잭션으로 묶기 쉽다.

### 2.5 워크플로 (LangGraph 등)

<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
다단계 워크플로는 새 계층이 아니라 **해당 기능 서비스의 구현 수단**이다. 다른 기능에서 LangGraph를 추가할 때는
`features/suggestions/`를 기준 구현으로 삼아 본뜬다.

<!-- AI-generated with Claude Sonnet 5.5, 2026-10-23, reviewed by Jaemin Kim -->
```
features/suggestions/
├── queries.py            # 아이 정보 조회 (프로필 · 잘 먹는 음식 · 지난 식사 기록) → dataclass
├── inputs.py             # 선택한 target과 리뷰 기록 → 워크플로 입력(FoodInput)
├── generator.py          # 서비스가 부르는 단일 진입점 (그래프 실행, 검증 실패 시 예외)
├── validation.py         # 결과 검증 — 순수 함수, 문제 목록을 반환
├── ingredients.py        # 재료 카탈로그 · 제한 판정 — 순수 함수
└── workflow/
    ├── state.py          # InputState · OutputState · GraphState, 입출력 dataclass, 컨텍스트
    ├── nodes.py          # 노드 (얇게)
    ├── graph.py          # 그래프 조립 (한 번 컴파일해 재사용)
    ├── prompts.py        # 프롬프트
    ├── schemas.py        # LLM 구조화 출력 스키마 (Pydantic)
    ├── llm.py            # 이 기능의 LLM 클라이언트 생성
    └── tools.py          # (현재 없음) LLM이 호출하는 도구가 필요할 때만 더한다
```

- 진입점은 서비스 하나다. 서비스가 DB에서 입력을 모으고(`queries.py` · `inputs.py`) `generator.py`의 함수를 불러
  결과를 저장한다. `router`나 서비스가 그래프를 직접 다루지 않는다. 타임아웃과 에러 변환(`AppError`)은 서비스가
  맡는다. 다른 기능의 데이터는 그 기능의 `service.py`가 아니라 모델을 직접 조회해 읽는다.
- **상태는 입력 · 출력 · 전체로 나눈다.** `InputState`(호출할 때 넘기는 값), `OutputState`(끝났을 때 돌려주는 값),
  `GraphState`(둘을 상속하고 `messages` 같은 내부 값을 더한 노드 간 전체 상태)를 `TypedDict`로 정의한다.
  내부 값은 첫 노드(`prepare`)가 초기화한다.
- **데이터는 상태에, 의존성은 컨텍스트에 둔다.** 입력 음식 · 아이의 제한 목록처럼 작업의 데이터는 상태에 넣고,
  LLM 클라이언트처럼 실행에 필요한 도구는 `context_schema`로 정의한 컨텍스트에 넣어 노드가
  `runtime: Runtime[Context]` 인자로 받는다. 그러면 노드가 최상위 함수가 되고 그래프를 한 번만 컴파일해 모든 요청이
  재사용한다.
- 노드는 얇게 둔다: 상태를 읽고, 순수 함수나 LLM을 호출하고, 바뀐 상태만 반환한다. 결정적 규칙은 `validation.py` ·
  `ingredients.py` 같은 순수 함수에 두어 그래프 없이 단위 테스트한다.
- **상태에 ORM 객체를 넣지 않는다.** 서비스가 모델을 평범한 값(dataclass)으로 바꿔 담는다.
- 노드가 DB를 더 읽어야 하면 의존성으로 주입한다. 노드가 직접 세션을 열지 않는다.
- **LLM 출력은 Pydantic으로 파싱한 뒤 dataclass로 바꾼다.** 외부에서 온 값이라 런타임 검증이 필요하기 때문이고,
  파싱 뒤 워크플로 안에서는 Pydantic 스키마를 쓰지 않는다.
- **결과 검증은 순수 함수가 한다.** 문제를 예외로 던지지 않고 문제 목록(자연어 없는 데이터)으로 반환해 `validate`
  노드가 재시도 여부를 정한다. 문구는 `prompts.py` 한 곳에서 만든다. 재시도를 다 쓰고도 통과하지 못한 결과는
  저장하지 않고 예외로 끝낸다.
- LLM 클라이언트는 그 기능의 `workflow/llm.py`에서 만들고, 프롬프트는 `prompts.py`에 모은다. 둘 이상의 기능이
  LLM을 쓰게 되면 `core/llm.py`로 올린다 (§2.4).
- **도구(`tools.py`)는 LLM이 상황에 따라 직접 조회해야 할 때만 둔다.** 항상 필요한 데이터는 도구가 아니라 서비스가
  입력으로 넘긴다. 도구는 읽기 전용이고 세션을 열지 않으며, `child_id`나 제한 목록 같은 식별자 · 권한 값은 LLM
  인자로 받지 않고 `InjectedState`로 상태에서 주입한다 (LLM이 다른 값을 지어내지 못하도록).
- 테스트에서는 LLM 클라이언트만 가짜로 바꿔 그래프 전체를 실행한다 (`tests/fake_chat_model.py`). 테스트에서 실제 LLM을
  호출하지 않는다.
- LangSmith 추적은 코드를 바꾸지 않고 환경변수로 켤 수 있다. 프롬프트에 아이의 식사 정보가 들어가므로, 운영에서
  켜기 전에 외부 서비스로 보내도 되는지 팀이 정한다.

### 2.6 로그인한 사용자 받기

로그인이 필요한 엔드포인트는 "이 요청을 누가 보냈는가"를 알아야 한다. 이 일은 `service.py`가 아니라
`router.py`가 FastAPI의 **의존성**으로 처리한다. 의존성(`Depends`)이란, 엔드포인트가 실행되기 전에 FastAPI가
대신 실행해서 그 결과를 엔드포인트 인자로 넣어 주는 함수다.

```python
# 어떤 기능의 router.py
from app.features.auth.dependencies import CurrentUser


@router.get("/meal-logs")
async def list_meal_logs(
    current_user: CurrentUser,
    service: Annotated[MealLogService, Depends(get_meal_log_service)],
) -> list[MealLogResponse]:
    logs = await service.list_for_user(user=current_user)
    return [MealLogResponse.model_validate(log) for log in logs]
```

처리 순서는 다음과 같다.

1. 클라이언트는 로그인으로 받은 `access_token`을 `Authorization: Bearer <토큰>` 헤더에 담아 보낸다.
2. 엔드포인트가 실행되기 전에 FastAPI가 `CurrentUser`(`get_current_user`)를 먼저 실행한다. 토큰이 위조되었거나
   만료되었거나 `refresh_token`이면 거부하고, 올바르면 토큰의 사용자를 DB에서 찾는다.
3. 문제가 없으면 찾은 `User`가 `current_user` 인자로 들어온다. 문제가 있으면 엔드포인트는 실행되지 않고
   401 `UNAUTHENTICATED` 에러가 응답된다.
4. 엔드포인트는 토큰이 아니라 `current_user`(또는 `user_id`)를 `service`에 넘긴다. `service.py`는 토큰이 무엇인지 모른다.

`CurrentUser`는 `features/auth/dependencies.py`에 있다. 토큰을 다루는 도구(`features/auth/security.py`)는 `auth`
기능 안에만 두고, 다른 기능은 `CurrentUser`만 import해서 쓴다 (§3).

## 3. 의존성 방향과 기능 간 규칙

```
features ──▶ models ──▶ core
   │                    ▲
   └──▶ api ────────────┘
```

A 파일이 B 파일을 `import`하면 "A는 B에 의존한다"고 한다. 위 그림의 화살표는 이 의존 방향이다.
화살표를 거슬러 import하지 않는다 (예: `core/`가 `features/`를 import하지 않는다).

**한 기능 안에서**
- `router.py`는 `service.py`를 쓰고, `service.py`는 `models/`를 쓴다 (`router → service → models`).
- `service.py`는 `router.py`나 DTO, FastAPI를 import하지 않는다. 그래야 `service.py`가 HTTP를 모르는
  순수한 비즈니스 로직으로 남는다.

**다른 기능을 쓸 때**
- 다른 기능의 **모델은 읽기 용도로 import할 수 있다.** 예를 들어 추천 기능이 식사 기록을 조회하려고
  `MealLog` 모델을 import하는 것은 괜찮다.
- **서비스는 다른 기능의 `service.py`를 호출하지 않는다.** 서비스끼리 서로 부르기 시작하면 어떤 기능이 어떤
  기능을 바꾸는지 따라가기 어려워진다. 다른 기능의 로직을 재사용해야 하면 그 로직을 `service.py` 밖의 별도
  함수 모듈(`queries.py` 등)로 분리하고, 원래 기능의 `service.py`와 이를 쓰는 다른 기능의 `service.py`가 **둘 다
  그 모듈을 import**한다. 분리한 모듈은 그 로직을 주로 쓰는 기능 폴더에 둔다.
- 다른 기능의 **`dependencies.py`는 `router.py`에서 import할 수 있다.** 대표적으로 로그인한 사용자가 필요한
  엔드포인트는 `auth`의 `CurrentUser`를 받는다 (§2.6). `auth`는 다른 기능을 import하지 않으므로 방향은 한쪽뿐이다.
- 기능끼리 서로를 import하는 **순환 import는 만들지 않는다.** A가 B를 쓰면 B는 A를 쓰지 않는다.

**다른 기능의 테이블을 참조할 때**
- 다른 기능의 테이블은 **ID 컬럼과 `ForeignKey("테이블.id", ...)`** 로만 가리킨다. `ForeignKey`는 테이블 이름을
  문자열로 적으므로 그 기능의 파일을 import하지 않아도 된다.
- 기능 사이에는 SQLAlchemy `relationship`(객체에서 연결된 객체를 바로 꺼내 쓰게 해 주는 기능)을 걸지 않는다.
  기능끼리 코드가 단단히 얽히기 때문이다. 필요하면 ID로 직접 조회한다.
- 두 테이블이 서로 가리킬 때는 `ForeignKey`를 **한쪽에만** 건다. 양쪽에 걸면 어느 테이블을 먼저 만들지
  정할 수 없어 마이그레이션이 꼬인다. 예: `meal_logs.recommendation_id`가 `meal_recommendations.id`를 가리키는
  `ForeignKey`만 있고, 반대쪽에는 없다.

**여러 기능을 합친 화면**
- 홈 화면처럼 여러 기능의 데이터를 모아 보여주는 엔드포인트는 `features/home/`처럼 조합 전용 기능을 만든다.
  `home/service.py`가 각 기능에서 분리된 함수 모듈(`queries.py` 등)을 호출해 조합하고, `home/router.py`는 그 결과를
  응답으로 내보낸다.

## 4. 요청 한 번의 흐름 (회원가입)

클라이언트가 `POST /api/v1/auth/signup`을 호출하면 다음 순서로 처리된다.

1. **요청 검증** (`router.py`): 클라이언트가 보낸 JSON이 `SignUpRequest`(요청 DTO)에 맞는지 검사한다.
   틀리면 여기서 멈추고 에러 응답을 보낸다 (§5).
2. **service 호출** (`router.py` → `service.py`): 검증을 통과한 값(이메일, 비밀번호, 이름)을
   `AuthService.sign_up`에 넘긴다.
3. **비즈니스 로직 실행** (`service.py`):
   - DB에서 같은 이메일의 `User`를 조회한다. 있으면 `EmailAlreadyExistsError`를 던지고 멈춘다.
   - 비밀번호를 암호화한다 (`features/auth/security.py`).
   - `User` 객체를 만들어 `session.add(user)`로 세션에 올리고, `flush()`로 DB에 저장(INSERT)한다.
4. **응답 만들기** (`router.py`): 저장된 `User`를 `UserResponse`(응답 DTO)로 바꿔 JSON으로 돌려준다 (201).
5. **커밋** (`core/database.py`): 에러 없이 끝났으면 `get_session`이 트랜잭션을 확정(commit)한다.
   중간에 에러가 났으면 되돌린다(rollback).

`models/user.py`는 `User`가 어떤 테이블인지만 정의한다. DB에 저장하는 동작은 `service.py`가 한다.

## 5. 에러 처리

**원칙: 서비스와 검증기는 에러 클래스를 `raise`만 하고, 그 에러를 어떤 응답으로 포장할지는 `router.py`가 정한다.**

### 5.1 역할 분담

| 위치 | 하는 일 |
|---|---|
| `core/errors.py` | `AppError`(에러 베이스), `RequestInvalidError`. 상태 코드 · 메시지를 모른다 |
| 서비스 · `field_validator` | `AppError` 하위 클래스를 던진다. 필요하면 속성으로 내용을 싣는다 (자연어 메시지 없음) |
| `router.py` | `ErrorSpec(status_code, error_code, details)`를 `@error_specs`로 선언한다 |
| `api/errors.py` | 선언을 실행(`ErrorMappedRoute`), 응답 모양 통일(`error_response`), 문서 생성, 폴백 핸들러 |

```python
# features/auth/service.py — 클래스와 데이터만
class EmailAlreadyExistsError(AppError):
    def __init__(self, email: str) -> None:
        super().__init__()
        self.email = email


# features/auth/router.py — 포장은 여기서
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

위 선언(`SIGN_UP_ERRORS`)은 "이 엔드포인트에서 `EmailAlreadyExistsError`가 발생하면 409 상태 코드와
`EMAIL_ALREADY_EXISTS` 코드로 응답한다"는 뜻이다. 에러 클래스 하나마다 `ErrorSpec` 하나를 짝지어 적는다.

- 같은 에러를 엔드포인트마다 다르게 응답하게 할 수 있다. 엔드포인트마다 자기 선언을 따로 붙이기 때문이다.
- 선언에 적지 않은 에러가 발생하면 500 에러로 응답한다. 서버의 실수이므로 로그에 남는다.
- `details`는 응답에 담을 추가 정보를 만드는 함수다. 에러 객체를 받아 dict를 돌려준다. 담을 것이 없으면 생략한다.

### 5.2 응답 모양

모든 에러 응답 본문은 하나의 모양이다. 상태 코드는 HTTP 상태로만 나가고 본문에는 넣지 않는다.

```json
{"error_code": "EMAIL_ALREADY_EXISTS", "details": {"email": "a@b.com"}}
```

- `error_code`는 대문자 SNAKE_CASE다. 클라이언트는 이 값으로 분기하고 사용자에게 보일 문구도 정한다.
- 응답 JSON은 `api/errors.py`의 `error_response()` 하나로만 만든다.
- 비밀번호 같은 비밀값은 `details`에 싣지 않는다.

### 5.3 처리 경로

| 실패 | 처리 |
|---|---|
| 서비스가 던진 `AppError` | `ErrorMappedRoute`가 잡아 `@error_specs` 선언대로 응답 |
| `field_validator`가 던진 `AppError` | 같은 경로. `AppError`가 `ValueError`를 상속해서 Pydantic이 `ValidationError`로 바꾸고, 원본은 `ctx["error"]`에 남아 꺼낸다 |
| 평범한 Pydantic 검증 실패 (필드 누락, 타입 불일치) | `RequestInvalidError`로 정규화 → 기본 422 `VALIDATION_ERROR` + `details.fields` (라우터가 `RequestInvalidError`를 선언해 덮어쓸 수 있다) |
| 선언이 없는 `AppError` | 500 `INTERNAL_ERROR` + 로그 |
| 라우트 밖 (404 · 405) | 앱 핸들러가 같은 모양으로 포장 (`NOT_FOUND`, `METHOD_NOT_ALLOWED`) |
| 처리 안 된 예외 | 500 `INTERNAL_ERROR` + 로그 |

**왜 `ErrorMappedRoute`인가.** Pydantic 검증은 엔드포인트 함수가 호출되기 *전에* 일어나므로 함수를 감싸는
데코레이터로는 검증 실패를 잡을 수 없다. 라우트 핸들러를 감싸면 서비스 에러와 검증 에러를 한 곳에서 같은 방식으로
처리할 수 있다. 모든 라우터는 `APIRouter(route_class=ErrorMappedRoute)`로 만들어야 하고, 빠뜨리면 선언이
적용되지 않으므로 `tests/test_errors.py`가 모든 v1 라우트를 검사한다.

**선언이 저장되는 곳.** `include_router`는 라우트 객체의 커스텀 속성을 복사하지 않지만 엔드포인트 함수는
그대로 보존한다. 그래서 `@error_specs`는 선언을 함수에 저장한다.

**의존성이 들고 다니는 선언.** 엔드포인트가 쓰는 의존성에도 `@error_specs`를 붙일 수 있다. 예를 들어
`get_current_user`는 "로그인하지 않으면 401 `UNAUTHENTICATED`" 선언을 직접 갖고 있다. `ErrorMappedRoute`가
엔드포인트가 받는 의존성들의 선언을 자동으로 모으므로, `CurrentUser`를 받는 엔드포인트는 로그인 관련 에러를
따로 적지 않아도 되고 `/docs`에도 401이 나타난다. 엔드포인트에 직접 적은 선언은 의존성의 선언보다 우선한다.

**`/docs` 자동 생성.** `ErrorMappedRoute`가 선언을 상태 코드별로 묶어 OpenAPI `responses`를 만든다
(같은 상태 코드의 `error_code`는 설명에 이어 붙인다). 선언 하나가 동작과 문서를 함께 결정한다.

**로그.** 에러를 응답으로 바꿀 때 응답과 같은 내용(`error_code`, `details`)을 로그로 남긴다 (5xx는 ERROR,
그 외는 INFO).

### 5.4 검증기 규칙

- 검증기는 **값 자체만으로 판단되는 규칙**(형식, 길이)만 맡는다. DB 조회가 필요한 규칙(이메일 중복)은 서비스가 던진다.
- 에러로 구분해야 하는 규칙은 `Field(min_length=...)` 같은 Pydantic 기본 제약 대신 `field_validator`에서 우리
  에러를 던진다. 그래야 응답이 `error_code`를 갖는다. 필수 필드 누락 같은 자동 검증은 `VALIDATION_ERROR`로 나간다.
- 이메일 형식 판정처럼 Pydantic의 도구를 쓰고 싶으면 `TypeAdapter(EmailStr)`로 검증하고, 실패를 우리 에러로 바꿔 던진다.

## 6. 코드 배치 규칙

위 설계를 지키기 위한 요약이다. 근거는 각 절을 참고한다.

- 의존성 방향: `features → models → core`, `features → api`. `service`는 `router` · DTO · FastAPI를 import하지 않는다 (§3).
- 기능 폴더의 기본 파일 세트는 `router.py · service.py`. 필요할 때만 `dto.py · exceptions.py · queries.py` 등을 더한다 (§2.1).
- 리포지토리 계층은 두지 않는다. 서비스가 세션을 직접 쓰고, 길거나 재사용되는 쿼리는 `queries.py` 함수로 뺀다.
- DB 조회가 필요 없는 계산 규칙은 순수 함수 모듈로 분리한다 (`analysis.py`, `scoring.py`).
- 다른 기능의 `service.py`는 호출하지 않는다. 다른 기능의 로직을 재사용하려면 함수 모듈로 분리해 양쪽 서비스가
  import한다 (§3).
- 다른 기능의 테이블은 ID + FK 문자열로만 참조하고 FK는 한쪽에만 건다 (§3).
- 에러는 `AppError` 하위 클래스를 던지기만 한다. 상태 코드 · `error_code` · `details`는 `router.py`의 `@error_specs`에서만 정한다 (§5).
- 새 모델은 `models/__init__.py`에 추가한다. `migrations/env.py`와 `tests/conftest.py`는 `app.models`를 import하므로 따로 고칠 필요가 없다.
- 이름: DTO는 `*Request` / `*Response`, 모델 클래스는 접미사 없이 단수형(`User`).

## 7. 새 기능 추가하기

새 기능(예: `meal_logs`)을 추가할 때:

1. `app/models/`에 모델 파일을 만들고 `models/__init__.py`에 추가한다. 테이블 규칙(`created_at`/`updated_at`, FK 옵션)을 지킨다.
2. `uv run alembic revision --autogenerate -m "설명"`으로 마이그레이션을 만든다 (DB에 적용하는 것은 팀원과 확인한 뒤에 한다).
3. `app/features/<기능>/service.py`에 서비스와 에러 클래스를 작성한다.
4. `app/features/<기능>/router.py`에 DTO, `APIRouter(route_class=ErrorMappedRoute)`, 엔드포인트, `@error_specs`를 작성한다.
5. `app/api/v1.py`에서 `include_router`로 등록한다.
6. 테스트를 추가하고 `uv run pytest` / `uv run ruff check .` 통과를 확인한다.

## 8. 버전 관리 전략

**API 버전 — URL path versioning**
- 경로 prefix로 노출: `/api/v1/...` (`app/api/v1.py`가 기능 라우터를 집약).
- **호환성 규칙은 App Market 출시 이후부터 적용한다.** 출시 전 내부 개발 단계에는 배포된 구버전
  클라이언트가 없으므로 호환 불가능한 변경을 따로 관리하지 않는다 (v1을 직접 수정하고 서버와
  클라이언트를 함께 맞춘다).
- 출시 이후, 한 버전 안에서는 **하위 호환(additive)** 변경만: 응답/요청에 선택 필드 추가는 가능,
  필드 삭제·이름 변경·타입 변경·새 필수 필드는 불가.
- 출시 이후 호환 불가능한 변경은 바뀐 기능에만 v2 라우터와 DTO를 추가하고 `api/v2.py`에서 `/api/v2`로 마운트한다.
  서비스와 모델은 v1과 공유한다. v1은 구버전 클라이언트가 거의 남지 않을 때까지 유지한다.

**클라이언트 버전과의 관계**
- DTO는 **API 버전**에 묶이고 클라이언트(앱) 버전에 묶이지 않는다. 여러 앱 버전이 하나의
  API 버전을 공유한다. 앱 버전별로 분기하면 조합이 폭발한다. 서비스와 모델 안에 `if client_version`
  분기를 두지 않는다.
- 모바일 앱은 스토어 업데이트에 달려 있어 구버전이 한동안 남는다. 서버는 호환되는 변경만 하고,
  클라이언트는 모르는 필드를 무시한다. 배포 순서는 항상 **서버 먼저, 클라이언트 나중**.
- 필요해지면 강제 업데이트 장치를 더한다: 앱이 `X-Client-Version` 헤더를 보내고, 서버가
  `MIN_SUPPORTED_CLIENT_VERSION` 미만이면 `426` + `error_code` `CLIENT_UPGRADE_REQUIRED`로
  응답해 앱이 업데이트 안내를 띄운다. 기능 켜고 끄기는 서버가 버전을 비교하지 않고 설정 응답의 기능 플래그로 알려준다.
  (현재는 미구현 — 클라이언트와 서버가 하나뿐이라 과함)

**DB 스키마 버전**
- DB 스키마 변경은 Alembic 리비전(`migrations/versions/`)으로 관리한다.

**앱/릴리스 버전**
- `pyproject.toml`의 `version` + 설정 `APP_VERSION`이 단일 출처.
  `/health` 응답과 OpenAPI(`/docs`)에 노출. 릴리스는 git 태그(`v0.1.0`, SemVer).

## 9. 기술 스택

| 영역 | 선택 | 근거 / 문서 |
|---|---|---|
| 웹 프레임워크 | FastAPI | RN 친화 REST, async, 자동 OpenAPI — https://fastapi.tiangolo.com/ |
| 설정 | pydantic-settings | `.env`/환경변수 타입 안전 로딩 — https://docs.pydantic.dev/latest/concepts/pydantic_settings/ |
| ORM | SQLAlchemy 2.0 (async) | 표준 async ORM — https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html |
| DB 드라이버 | psycopg 3 | Postgres 공식급 드라이버, sync/async 모두 지원 — https://www.psycopg.org/psycopg3/docs/ |
| 마이그레이션 | Alembic (async env) | 스키마 버전 관리 — https://alembic.sqlalchemy.org/ |
| 비밀번호 해싱 | pwdlib (argon2) | FastAPI 공식 튜토리얼 권장(구 passlib 대체) — https://fastapi.tiangolo.com/tutorial/security/ |
| JWT | PyJWT | access/refresh 토큰 — https://pyjwt.readthedocs.io/ |
| 패키지/가상환경 | uv | venv 자동 관리 + 빠름 — https://docs.astral.sh/uv/ |

## 10. 현재 상태 / 로드맵

**구현됨**
- `POST /api/v1/auth/signup` — 가입, 이메일 중복 409, 입력 검증 422
- `POST /api/v1/auth/login` — JWT access/refresh 발급, 자격 불일치 401
- `GET /api/v1/auth/me` — 로그인한 사용자 조회 (`CurrentUser` 의존성의 예시), 토큰 오류 401
- `GET /health` — 헬스체크 + 앱 버전

**다음 (auth)**
- [ ] `POST /api/v1/auth/refresh` — refresh token으로 access 재발급

**향후 기능**
- [ ] 서비스 기능 추가 (예: 식사 기록, 추천)
