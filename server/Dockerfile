# AI-generated with Claude Sonnet 5.5, 2026-10-17, reviewed by Jaemin Kim
# 운영 배포용 이미지. 빌드 컨텍스트는 server/ 디렉터리다.
#   docker build -t nurturebites-server server/
# 설정은 이미지에 넣지 않고 실행할 때 환경변수(--env-file)로 주입한다.
FROM python:3.12-slim

# uv 는 공식 이미지에서 바이너리만 복사한다. 로컬 개발 버전과 맞춰 고정한다.
COPY --from=ghcr.io/astral-sh/uv:0.9.3 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# 의존성을 먼저 설치해 소스만 바뀐 빌드에서는 이 레이어를 캐시로 재사용한다.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY alembic.ini ./
COPY migrations ./migrations
COPY app ./app

# root 가 아닌 사용자로 실행한다.
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# 마이그레이션은 시작할 때 자동 실행하지 않고 배포 단계에서 따로 실행한다.
# CloudFront 뒤에서 동작하므로 --proxy-headers 로 클라이언트 정보를 인식한다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
