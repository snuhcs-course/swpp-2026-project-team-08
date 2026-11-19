# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 보관 해제 컬럼 추가·되돌리기의 기존 데이터 보존 검증

"""격리된 메모리 DB에서 기존 저장·시도 추천의 보존을 확인한다."""

import importlib.util
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


def test_기존_저장_시도_상태와_저장_시각을_보존한다():
    path = (
        Path(__file__).parents[2] / "migrations/versions/20261118_1000_saved_suggestion_removal.py"
    )
    spec = importlib.util.spec_from_file_location("saved_removal_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    engine = sa.create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE food_recommendations (id INTEGER PRIMARY KEY, status TEXT, saved_at TEXT)"
        )
        before = [(1, "SAVED", "2026-11-16T00:00:00Z"), (2, "TRIED", "2026-11-17T00:00:00Z")]
        connection.exec_driver_sql("INSERT INTO food_recommendations VALUES (?, ?, ?)", before)
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        assert connection.exec_driver_sql(
            "SELECT id, status, saved_at, removed_from_saved_at "
            "FROM food_recommendations ORDER BY id"
        ).all() == [(*row, None) for row in before]
        module.downgrade()
        assert (
            connection.exec_driver_sql("SELECT * FROM food_recommendations ORDER BY id").all()
            == before
        )
    engine.dispose()
