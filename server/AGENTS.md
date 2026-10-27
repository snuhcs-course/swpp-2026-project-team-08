<!-- AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim -->
<!-- Changed: 배포 관련 문서 추가 -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- Changed: ingredient 관련 문서 작성 -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- Changed: suggestion 관련 문서 업데이트 -->
<!-- AI-generated with GPT-6, 2026-10-26, reviewed by Haechan Jung -->
<!-- Changed: AI 주석 규칙 및 문서 정리 -->

이 디렉터리는 FastAPI + Postgres 백엔드 서버다. 이 문서는 **LLM이 특히 지켜야 할 규칙**만 담는다.
설치·실행·검사 명령은 `README.md`, 아키텍처는 `docs/architecture.md`, 배포는 `docs/deploy.md`에 있다.

## 작업 전에

이 디렉터리에서 작업할 때도 루트 [`AGENTS.md`](../AGENTS.md)의 공통 규칙을 함께 따른다.

- `README.md`(실행 환경 · 기술 구성)와 `docs/architecture.md`를 먼저 읽는다.
- `Dockerfile`, `deploy/`, `.github/workflows/`, 환경변수를 다루는 작업이면 [`docs/deploy.md`](docs/deploy.md)도
  먼저 읽어야 한다.
- 알러지 · 식이 제한 id(`RestrictionId`)나 재료 카탈로그를 다루는 작업이면
  [`../docs/food-ingredient-restriction-ids.md`](../docs/food-ingredient-restriction-ids.md)도 먼저 읽어야 한다.
  클라이언트와 id가 같아야 한다.
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-26, reviewed by Jaemin Kim -->
- 추천(`features/suggestions/`)의 입력 · 프롬프트 · 검증을 바꾸는 작업이면
  [`../docs/recommendation-logic.md`](../docs/recommendation-logic.md)도 먼저 읽어야 한다.
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-26, reviewed by Jaemin Kim -->
- 테이블이나 모델을 만들거나 바꾸는 작업이면 [`../docs/db-schemas.md`](../docs/db-schemas.md)도 먼저 읽어야 하고,
  관계나 키를 바꾸면 이 문서도 같은 변경에서 고쳐야 한다.
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
- LangGraph 같은 LLM 워크플로를 만들거나 고치는 작업이면 `docs/architecture.md` §2.5와 기준 구현인
  `app/features/suggestions/`를 먼저 읽고 그 구조를 따라야 한다.
- 기존 코드와 패턴을 먼저 확인하고, 필요한 파일만 추가한다.

## AI 생성 코드 표기

루트 [`AGENTS.md`](../AGENTS.md)의 **AI 생성 코드 표기** 규칙을 따른다.
이 디렉터리에서 주석 문법은 Python · TOML · YAML · `.env.example` · `.ini`는 `#`, Markdown은 `<!-- -->`이며,
Python 파일의 모듈 docstring이 있으면 그 앞(맨 위)에 둔다.

## 하지 말 것

- 테스트에서 실제 LLM API를 호출하지 않는다. LLM만 가짜 모델로 바꿔 그래프를 실행한다.
- LLM 도구(tool)의 인자로 `child_id`나 제한 목록 같은 식별자 · 권한 값을 LLM이 넘기게 하지 않는다.
  `InjectedState`로 상태에서 주입한다.
- 검증을 통과하지 못한 LLM 결과를 저장하지 않는다. 재시도를 소진하면 예외로 끝낸다.

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


## 기능 간 규칙

기능 간 의존성·모델 참조·공유 로직 배치는
[아키텍처의 의존성 방향과 기능 간 규칙](docs/architecture.md#3-의존성-방향과-기능-간-규칙)을 따른다.

## 필수 검증

커밋·PR 전 서버 테스트·린트·포맷 검사가 모두 통과해야 한다.
실행 명령은 [`README.md`](README.md)의 명령어 표를 따른다.
