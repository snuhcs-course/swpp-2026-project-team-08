# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: .env 의 LangSmith 변수를 서버 시작 때 환경변수로 내보내는 로더 추가

"""LangSmith 추적 설정 로더.

`Settings` 는 `.env` 를 읽어도 `os.environ` 에 넣지 않는다. 그런데 LangSmith SDK 는 `os.environ` 만
읽으므로, `uvicorn` 으로 서버를 띄우면 `.env` 에만 있는 `LANGSMITH_*` 가 보이지 않아 추적이 꺼진다.
그래서 서버가 시작할 때 `.env` 의 LangSmith 변수만 골라 환경변수로 내보낸다.
운영은 컨테이너가 환경변수를 직접 주입하므로 이 함수는 아무것도 바꾸지 않는다.
"""

import os

from dotenv import dotenv_values

TRACING_PREFIXES = ("LANGSMITH_", "LANGCHAIN_")


def export_tracing_env(env_file: str = ".env") -> list[str]:
    """`.env` 의 LangSmith 변수를 환경변수로 내보내고, 내보낸 변수 이름을 돌려준다.

    이미 환경변수에 있는 값은 덮어쓰지 않는다. 값은 돌려주거나 기록하지 않는다 (비밀 값 포함).
    """
    exported = []
    for name, value in dotenv_values(env_file).items():
        if name.startswith(TRACING_PREFIXES) and value is not None and name not in os.environ:
            os.environ[name] = value
            exported.append(name)
    return exported
