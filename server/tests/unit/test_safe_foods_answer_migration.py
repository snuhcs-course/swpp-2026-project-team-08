# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 음식 없음 마이그레이션의 기존 데이터 보존 검증

"""격리된 인메모리 DB에서 마이그레이션을 확인한다."""

import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


def test_migration_preserves_legacy_rows_without_assuming_no_foods():
    path = Path(__file__).parents[2] / "migrations/versions/20261115_1000_safe_foods_answer.py"
    spec = importlib.util.spec_from_file_location("safe_foods_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    engine = sa.create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE user_profiles (user_id INTEGER PRIMARY KEY)")
        connection.exec_driver_sql("INSERT INTO user_profiles VALUES (1)")
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        assert connection.exec_driver_sql(
            "SELECT user_id, no_safe_foods FROM user_profiles"
        ).all() == [(1, 0)]
        module.downgrade()
        assert connection.exec_driver_sql("SELECT * FROM user_profiles").all() == [(1,)]
    engine.dispose()
