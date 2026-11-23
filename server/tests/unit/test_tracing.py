# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: .env 의 LangSmith 변수 내보내기 규칙과 서버 시작 시 호출 검증 추가

"""`.env` 의 LangSmith 변수를 서버가 시작할 때 환경변수로 내보내는지 검증한다."""

import os

import pytest

from app.core.tracing import export_tracing_env
from app.main import app


def write_env(directory, text: str) -> str:
    path = directory / ".env"
    path.write_text(text, encoding="utf-8")
    return str(path)


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch):
    for name in ("LANGSMITH_TRACING", "LANGSMITH_API_KEY", "LANGCHAIN_PROJECT", "JWT_SECRET_KEY"):
        monkeypatch.delenv(name, raising=False)


def test_only_langsmith_variables_are_exported(tmp_path, monkeypatch) -> None:
    env_file = write_env(
        tmp_path,
        "LANGSMITH_TRACING=true\nLANGSMITH_API_KEY=ls-secret\nLANGCHAIN_PROJECT=demo\n"
        "JWT_SECRET_KEY=other-secret\nOPENROUTER_API_KEY=or-secret\n",
    )
    monkeypatch.setattr(os, "environ", os.environ.copy())

    exported = export_tracing_env(env_file)

    assert sorted(exported) == ["LANGCHAIN_PROJECT", "LANGSMITH_API_KEY", "LANGSMITH_TRACING"]
    assert os.environ["LANGSMITH_TRACING"] == "true"
    assert os.environ["LANGSMITH_API_KEY"] == "ls-secret"
    assert "JWT_SECRET_KEY" not in os.environ
    # 비밀 값은 반환값에 싣지 않는다.
    assert all("secret" not in name for name in exported)


def test_existing_environment_values_are_not_overwritten(tmp_path, monkeypatch) -> None:
    env_file = write_env(tmp_path, "LANGSMITH_TRACING=true\nLANGSMITH_API_KEY=from-file\n")
    monkeypatch.setattr(os, "environ", os.environ.copy())
    os.environ["LANGSMITH_API_KEY"] = "from-environment"

    exported = export_tracing_env(env_file)

    assert exported == ["LANGSMITH_TRACING"]
    assert os.environ["LANGSMITH_API_KEY"] == "from-environment"


def test_a_missing_env_file_exports_nothing(tmp_path) -> None:
    assert export_tracing_env(str(tmp_path / "missing.env")) == []


async def test_the_server_exports_them_on_startup(tmp_path, monkeypatch) -> None:
    write_env(tmp_path, "LANGSMITH_TRACING=true\n")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(os, "environ", os.environ.copy())

    async with app.router.lifespan_context(app):
        assert os.environ["LANGSMITH_TRACING"] == "true"
