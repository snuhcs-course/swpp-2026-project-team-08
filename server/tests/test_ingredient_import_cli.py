# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""적재 CLI의 환경 구분과 운영 트랜잭션 경로. 실제 DB에는 연결하지 않는다."""

import runpy
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def importer(monkeypatch):
    script = Path(__file__).resolve().parents[2] / "data/ingredient_restrictions/import_to_db.py"
    module = runpy.run_path(str(script))
    main = module["main"]
    scope = main.__globals__
    monkeypatch.setitem(scope, "read_dataset", lambda: module["Dataset"]([], [], [], 0))
    engine_factory = MagicMock()
    monkeypatch.setitem(scope, "create_async_engine", engine_factory)
    return main, scope, engine_factory


@pytest.mark.asyncio
async def test_validation_does_not_read_connection_settings(importer, monkeypatch):
    main, scope, engine_factory = importer
    settings = MagicMock(side_effect=AssertionError("validation must not read settings"))
    monkeypatch.setitem(scope, "Settings", settings)
    monkeypatch.setattr("sys.argv", ["import_to_db.py"])
    await main()
    settings.assert_not_called()
    engine_factory.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("flag", "environment", "host"),
    [
        ("--apply-production", "local", "localhost"),
        ("--apply-local", "production", "db.internal"),
        ("--apply-local", "local", "db.internal"),
    ],
)
async def test_wrong_target_is_rejected_before_connection(
    importer, monkeypatch, flag, environment, host
):
    main, scope, engine_factory = importer
    monkeypatch.setitem(
        scope, "Settings", lambda **_: SimpleNamespace(ENVIRONMENT=environment, POSTGRES_HOST=host)
    )
    monkeypatch.setattr("sys.argv", ["import_to_db.py", flag])
    with pytest.raises(ValueError):
        await main()
    engine_factory.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("fails", [False, True])
async def test_production_import_uses_transaction_and_disposes(importer, monkeypatch, fails):
    main, scope, engine_factory = importer
    monkeypatch.setitem(
        scope,
        "Settings",
        lambda **_: SimpleNamespace(ENVIRONMENT="production", database_url="test-dsn"),
    )
    monkeypatch.setattr("sys.argv", ["import_to_db.py", "--apply-production"])
    engine = MagicMock(dispose=AsyncMock())
    engine_factory.return_value = engine
    transaction = MagicMock()
    transaction.__aenter__ = AsyncMock(return_value="session")
    transaction.__aexit__ = AsyncMock(return_value=False)
    factory = MagicMock()
    factory.begin.return_value = transaction
    monkeypatch.setitem(scope, "async_sessionmaker", MagicMock(return_value=factory))
    write = AsyncMock(side_effect=RuntimeError("import failed") if fails else None)
    monkeypatch.setitem(scope, "import_dataset", write)
    if fails:
        with pytest.raises(RuntimeError, match="import failed"):
            await main()
    else:
        await main()
    engine_factory.assert_called_once_with("test-dsn")
    write.assert_awaited_once()
    assert transaction.__aexit__.await_args.args[0] is (RuntimeError if fails else None)
    engine.dispose.assert_awaited_once()
