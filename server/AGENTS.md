<!-- AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim -->

이 디렉터리는 FastAPI + Postgres 백엔드 서버다. 이 문서는 **LLM이 특히 지켜야 할 규칙**만 담는다.
설치·실행·테스트·일반 규칙은 `README.md`, 아키텍처는 `docs/architecture.md`, 배포는 `docs/deploy.md`에 있다.

## 작업 전에

- `README.md`(작업 규칙 · 컨벤션)와 `docs/architecture.md`를 먼저 읽는다.
- `Dockerfile`, `deploy/`, `.github/workflows/`, 환경변수를 다루는 작업이면 [`docs/deploy.md`](docs/deploy.md)도
  먼저 읽어야 한다.
- 기존 코드와 패턴을 먼저 확인하고, 필요한 파일만 추가한다.

## AI 생성 코드 표기

LLM이 작성한 코드에는 저장소 루트 [`AGENTS.md`](../AGENTS.md)의 **AI 생성 코드 표기** 규칙에 따라
`AI-generated with <Model Name>, <Date>, reviewed by <User Name>` 주석을 단다.
이 디렉터리에서 주석 문법은 Python · TOML · YAML · `.env.example` · `.ini`는 `#`, Markdown은 `<!-- -->`이며,
Python 파일의 모듈 docstring이 있으면 그 앞(맨 위)에 둔다.

## 하지 말 것

- 실패하는 테스트를 지우거나 약화해서 통과시키지 않는다. 원인을 고친다.
- 검증하지 않고 "완료"라고 하지 않는다. 끝내기 전에 `uv run pytest`와 `uv run ruff check .`를 실행하고,
  실패했거나 실행하지 못했으면 그대로 보고한다.
- `.env`나 비밀값을 읽어 출력하거나 커밋하지 않는다.
- `docs/architecture.md`의 구조 · 의존성 규칙과 어긋나는 변경을 조용히 하지 않는다. 필요하면
  문서를 먼저 고치자고 제안한다.
- 요청 범위를 넘어 리팩터링하지 않는다.
- 에러 클래스에 자연어 메시지나 HTTP 상태 코드를 넣지 않는다. 에러는 클래스와 데이터(속성)만 갖고,
  응답 포장(상태 코드 · `error_code` · `details`)은 `router.py`의 `@error_specs`에서만 정한다.
- 다른 기능의 `service.py`를 호출하지 않는다. 로직을 재사용해야 하면 함수 모듈(`queries.py` 등)로 분리해
  양쪽 서비스가 import한다.

## DB에 영향을 주는 작업은 반드시 사용자 확인

DB 데이터나 스키마를 바꾸거나 지울 수 있는 작업은 **실행 전에 반드시 사용자에게 확인**받는다.
확인받은 범위를 넘어 다른 DB 작업으로 확장하지 않는다.

- `uv run alembic upgrade ...` / `downgrade ...` (마이그레이션 적용 · 되돌리기)
- `docker compose down -v` 등 DB 볼륨을 지우는 명령, DB 컨테이너 재생성
- `DROP` / `TRUNCATE` / `DELETE` 등을 직접 실행하는 SQL, 시드 · 데이터 수정 스크립트 실행

마이그레이션 파일을 *생성*(`alembic revision`)하거나 `alembic upgrade head --sql`처럼 SQL만 출력하는 것은
DB를 바꾸지 않으므로 확인 없이 해도 된다.

## 배포 관련 작업

배포 흐름과 운영 방법은 [`docs/deploy.md`](docs/deploy.md)에 있다.

- `Dockerfile`, `deploy/`, `.github/workflows/`, 환경변수, 배포 방식을 바꾸면 `docs/deploy.md`도 같은 변경에서
  함께 고쳐야 한다.
- `Dockerfile`을 바꾸면 `docker build server`로 빌드가 되는지 확인해야 한다. 확인하지 못했으면 그대로 보고해야 한다.
- 새 환경변수를 추가하면 `core/config.py`와 `.env.example`을 함께 고쳐야 하고, 운영 Parameter Store 등록은
  사용자가 해야 하므로 작업을 보고할 때 등록이 필요하다고 명시해야 한다.
- 아래 작업은 **실행 전에 반드시 사용자에게 확인**받아야 한다. 확인받은 범위를 넘어 확장하지 않는다.
  - AWS 리소스를 만들거나 바꾸거나 지우는 명령, SSM Parameter Store 값 변경
  - 운영 RDS에 접속하거나 데이터를 바꾸는 작업
  - 배포를 일으키는 동작 (`main` 머지, Server Deploy 수동 실행)

## 코드 품질 우선순위

코드를 작성 · 수정할 때는 다음 순서로 판단한다 (`README.md`의 코드 품질 기준과 같다).

1. **단일 책임 원칙.** 파일 · 클래스 · 함수가 하나의 역할만 맡게 한다.
2. **사람이 이해하고 유지보수할 수 있는가.** 역할별로 잘 나뉘어 이름만 보고 예측하고 이해할 수 있어야 하고,
   쉽게 수정할 수 있어야 한다. 영리하거나 짧은 코드보다 읽기 쉬운 코드를 택한다.
