<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim -->
<!-- Changed: server bootstraping -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim -->
<!-- Changed: deploy 관련 문서 추가 -->
<!-- AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo -->
<!-- Changed: 화면 디자인 및 식사 흐름 개선 -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- Changed: suggestion 관련 문서 업데이트 -->
<!-- AI-generated with GPT-6, 2026-10-26, reviewed by Haechan Jung -->
<!-- Changed: 문서 역할 정리 -->

# 서버

목차: [설치와 실행](#설치와-실행) · [검증](#검증) · [의존성과 빌드](#의존성과-빌드) · [문서](#문서)

- FastAPI / PostgreSQL 백엔드 API다.
- 실행 환경은 `.env`로 설정하고, DB 스키마는 Alembic으로 관리한다.
- 작업 검증은 테스트·린트·포맷 검사로 수행한다.

## 설치와 실행

Python 3.12 이상, uv, Docker가 필요하다. 패키지 버전은 `pyproject.toml`과 `uv.lock`을 기준으로 한다.
저장소 루트에서 실행한다.

```bash
cd server
uv sync --frozen
```

최초 설치 시 환경변수 파일을 준비한다. 기존 `.env`가 있으면 복사하지 않고 필요한 설정만 확인한다.

```bash
cp .env.example .env
```

환경변수 목록은 [`.env.example`](.env.example)을 참고한다. 로컬 이외 환경에서는 `JWT_SECRET_KEY`를 교체한다.
로컬 PostgreSQL을 시작하고, DB가 준비되면 마이그레이션을 적용한 뒤 서버를 실행한다.

```bash
docker compose up -d
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API 명세는 [Swagger UI](http://localhost:8000/docs), 실행 상태는
[헬스 체크](http://localhost:8000/health)에서 확인한다.
기기에서 서버에 접속하려면 실행 명령에 `--host 0.0.0.0`을 추가하고 기기에서 접근할 수 있는 서버 주소를 사용한다.

DB 스키마 변경에 사용하는 명령은 다음과 같다. 모두 `server/`에서 실행한다.

| 작업 | 명령어 |
|---|---|
| 마이그레이션 생성 | `uv run alembic revision --autogenerate -m "설명"` |
| 마이그레이션 적용 | `uv run alembic upgrade head` |
| 마이그레이션 한 단계 되돌리기 | `uv run alembic downgrade -1` |

기존 DB에 적용하기 전에는 마이그레이션 내용을 확인한다. 컬럼 삭제로 사라진 데이터는 되돌리기로 복구되지 않는다.
서버 시작 시 마이그레이션은 자동 적용되지 않는다.

## 검증

`server/`에서 실행한다. 테스트는 인메모리 SQLite를 사용하므로 PostgreSQL이 필요하지 않다.

| 작업 | 명령어 |
|---|---|
| 테스트 | `uv run pytest` |
| Unit·Integration·통합 커버리지 | `uv run python scripts/coverage_report.py` ([범위·Layer 기준](tests/test.md#커버리지-측정)) |
| 린트 | `uv run ruff check .` |
| 포맷 검사 | `uv run ruff format --check .` |

포맷을 자동 수정하려면 `uv run ruff format .`을 실행한다.

## 의존성과 빌드

의존성은 uv로 관리한다. `server/`에서 실행한다.

```bash
uv add <package>
uv remove <package>
```

개발용 의존성은 `--dev`를 붙여 추가하거나 제거한다.
배포용 Docker 이미지는 같은 디렉터리에서 빌드한다.

```bash
docker build -t nurturebites-server .
```

실행 환경변수는 이미지에 포함하지 않고 컨테이너 실행 시 주입한다.
배포 절차와 운영 설정은 [배포 문서](docs/deploy.md)를 따른다.

## 문서

- [작업 규칙](AGENTS.md)
- [테스트 분류와 커버리지](tests/test.md)
- [프로젝트 아키텍처](docs/architecture.md)
- [배포와 운영](docs/deploy.md)
- [추천 정책](docs/recommendation-policy.md)
- [환경변수 목록](.env.example)
