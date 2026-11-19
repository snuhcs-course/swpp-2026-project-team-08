# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 보관 해제 마이그레이션의 PostgreSQL SQL 검증

"""DB 접속 없이 보관 해제 컬럼의 PostgreSQL 변경문을 검사한다."""

import importlib.util
from io import StringIO
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations


def test_기존_추천을_숨기지_않는_선택적_시간대_컬럼을_추가한다():
    path = (
        Path(__file__).parents[2] / "migrations/versions/20261118_1000_saved_suggestion_removal.py"
    )
    spec = importlib.util.spec_from_file_location("saved_removal_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    module.op = Operations(context)
    module.upgrade()
    assert output.getvalue().strip() == (
        "ALTER TABLE food_recommendations ADD COLUMN "
        "removed_from_saved_at TIMESTAMP WITH TIME ZONE;"
    )
    assert module.down_revision == "0027_safe_foods_answer"
