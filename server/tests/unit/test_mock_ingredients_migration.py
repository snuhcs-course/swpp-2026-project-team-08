# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 재료 카탈로그 API 삭제에 맞춰 마이그레이션 테스트만 단위 테스트로 이동
"""Unit: 0012 마이그레이션이 mock 재료 카탈로그를 안정적인 id 로 심는지 확인한다."""

from pathlib import Path
from runpy import run_path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, text


def test_mock_catalog_migration_seeds_stable_ids() -> None:
    migration_path = (
        Path(__file__).resolve().parents[2]
        / "migrations/versions/20261021_1300_mock_ingredients.py"
    )
    migration = run_path(str(migration_path))
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            migration["upgrade"]()
        rows = connection.execute(text("SELECT id, name FROM ingredients ORDER BY id")).all()
        assert rows[:2] == [(182, "당근"), (212, "감자")]
        assert len(rows) == 8
        with Operations.context(context):
            migration["downgrade"]()
    engine.dispose()
