# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 기존 추천 음식명 이관과 시도 기록 보존 검증

from pathlib import Path
from runpy import run_path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError


def test_migration_backfills_food_names_and_preserves_tries():
    migration = run_path(
        str(
            Path(__file__).parents[2]
            / "migrations/versions/20261126_1000_recommendation_food_name.py"
        )
    )
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE meal_foods (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
        conn.exec_driver_sql(
            "CREATE TABLE food_recommendations (id INTEGER PRIMARY KEY, "
            "origin_food_id INTEGER NOT NULL REFERENCES meal_foods(id) ON DELETE CASCADE)"
        )
        conn.exec_driver_sql(
            "CREATE TABLE food_recommendation_tries (id INTEGER PRIMARY KEY, "
            "food_recommendation_id INTEGER REFERENCES food_recommendations(id) ON DELETE CASCADE, "
            "food_id INTEGER REFERENCES meal_foods(id) ON DELETE CASCADE)"
        )
        conn.exec_driver_sql("INSERT INTO meal_foods VALUES (1, '감자'), (2, '두부')")
        conn.exec_driver_sql("INSERT INTO food_recommendations VALUES (10, 2), (11, 1)")
        conn.exec_driver_sql("INSERT INTO food_recommendation_tries VALUES (5, 10, 1)")

        with Operations.context(MigrationContext.configure(conn)):
            migration["upgrade"]()

        conn.exec_driver_sql(
            "INSERT INTO food_recommendations (id, food_name) VALUES (12, '당근죽')"
        )
        assert conn.exec_driver_sql(
            "SELECT id, origin_food_id, food_name FROM food_recommendations ORDER BY id"
        ).all() == [(10, 2, "두부"), (11, 1, "감자"), (12, None, "당근죽")]
        assert conn.exec_driver_sql(
            "SELECT id, food_recommendation_id, food_id FROM food_recommendation_tries"
        ).one() == (5, 10, 1)
        assert conn.exec_driver_sql("PRAGMA foreign_key_check").all() == []
        with pytest.raises(IntegrityError, match="food_name"):
            conn.exec_driver_sql(
                "INSERT INTO food_recommendations (id, origin_food_id) VALUES (13, 1)"
            )
    engine.dispose()
