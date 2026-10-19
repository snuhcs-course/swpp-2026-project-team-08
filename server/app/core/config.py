# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
"""애플리케이션 설정.

pydantic-settings 로 .env / 환경변수에서 설정을 읽는다.
참고: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
"""

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_JWT_SECRET = "dev-only-secret-change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──
    APP_NAME: str = "Server API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "local"
    DEBUG: bool = False

    # ── Database ──
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "server"
    POSTGRES_PASSWORD: str = "server"
    POSTGRES_DB: str = "server"

    # ── JWT ──
    JWT_SECRET_KEY: str = _DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
    # ── LLM (suggestions) ──
    # 비어 있으면 앱은 기동하지만 제안 생성은 실패한다.
    OPENAI_API_KEY: str = ""
    SUGGESTION_MODEL: str = "gpt-6-luna"

    @model_validator(mode="after")
    def _forbid_dev_secret_outside_local(self) -> "Settings":
        """local 이 아닌 환경에서 개발용 JWT 시크릿을 쓰면 기동을 막는다."""
        if self.ENVIRONMENT != "local" and self.JWT_SECRET_KEY == _DEV_JWT_SECRET:
            raise ValueError("local 이외 환경에서는 JWT_SECRET_KEY 를 반드시 교체해야 합니다")
        return self

    @property
    def database_url(self) -> str:
        """SQLAlchemy async 엔진용 DSN (psycopg 3 드라이버)."""
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    """설정 싱글턴. lru_cache 로 프로세스당 한 번만 로드한다."""
    return Settings()
