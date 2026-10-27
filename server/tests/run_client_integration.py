# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
"""Run the client suite against a real HTTP API backed by disposable PostgreSQL.

Run from server/: uv run python -m tests.run_client_integration
"""

import asyncio
import os
import socket
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_session
from app.main import create_app
from app.models import Ingredient


async def docker(*arguments: str) -> str:
    process = await asyncio.create_subprocess_exec(
        "docker", *arguments, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    if process.returncode:
        raise RuntimeError(f"Docker command failed: {stderr.decode().strip()}")
    return stdout.decode().strip()


@asynccontextmanager
async def test_database() -> AsyncGenerator[str, None]:
    container = await docker(
        "run",
        "--detach",
        "--rm",
        "--publish",
        "127.0.0.1::5432",
        "--tmpfs",
        "/var/lib/postgresql/data",
        "--env",
        "POSTGRES_USER=integration",
        "--env",
        "POSTGRES_PASSWORD=integration",
        "--env",
        "POSTGRES_DB=integration",
        "postgres:16-alpine",
    )
    try:
        async with asyncio.timeout(30):
            while True:
                try:
                    await docker(
                        "exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "integration"
                    )
                    break
                except RuntimeError:
                    await asyncio.sleep(0.1)
        address = await docker("port", container, "5432/tcp")
        port = int(address.rsplit(":", 1)[1])
        yield f"postgresql+psycopg://integration:integration@127.0.0.1:{port}/integration"
    finally:
        await docker("rm", "--force", container)


async def run_suite(database_url: str) -> int:
    engine = create_async_engine(database_url)

    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def test_session() -> AsyncGenerator[AsyncSession, None]:
        async with sessions.begin() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_session] = test_session
    client_dir = Path(__file__).resolve().parents[2] / "client"
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with sessions.begin() as session:
            session.add(Ingredient(id=1, name="Egg"))

        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
            server = uvicorn.Server(uvicorn.Config(app, log_level="warning", access_log=False))
            server_task = asyncio.create_task(server.serve(sockets=[listener]))
            process = None
            try:
                async with asyncio.timeout(15):
                    while not server.started:
                        if server_task.done():
                            await server_task
                            raise RuntimeError("Integration API stopped before startup")
                        await asyncio.sleep(0.01)
                print(
                    f"Integration API: http://127.0.0.1:{port} (disposable PostgreSQL)", flush=True
                )
                tests = sorted(str(path) for path in (client_dir / "tests").glob("*.test.cjs"))
                process = await asyncio.create_subprocess_exec(
                    "node",
                    "--test",
                    *tests,
                    cwd=client_dir,
                    env={**os.environ, "API_URL": f"http://127.0.0.1:{port}"},
                )
                async with asyncio.timeout(60):
                    return await process.wait()
            finally:
                if process is not None and process.returncode is None:
                    process.terminate()
                    await process.wait()
                server.should_exit = True
                await server_task
    finally:
        await engine.dispose()


async def main() -> int:
    async with test_database() as database_url:
        return await run_suite(database_url)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
