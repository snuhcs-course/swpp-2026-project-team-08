# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Check migration history and generated SQL without connecting to a database."""

from io import StringIO
from pathlib import Path
from runpy import run_path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"


def test_removal_joins_both_existing_heads():
    scripts = ScriptDirectory(str(MIGRATIONS))
    assert scripts.get_heads() == ["0006_boolean_feedback"]
    assert set(scripts.get_revision("0005_remove_exposure").down_revision) == {
        "0004_final_abc_fields",
        "0004_user_email_change",
    }


def test_removal_sql_and_empty_column_restore():
    migration = run_path(str(MIGRATIONS / "versions" / "20261019_1200_remove_exposure.py"))
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    with Operations.context(context):
        migration["upgrade"]()
    assert "ALTER TABLE meal_reviews DROP COLUMN goal_feedback" in output.getvalue()
    assert "ALTER TABLE meal_logs DROP COLUMN exposure_food_id" in output.getvalue()
    output.seek(0)
    output.truncate()
    with Operations.context(context):
        migration["downgrade"]()
    assert "ALTER TABLE meal_logs ADD COLUMN exposure_food_id VARCHAR(80)" in output.getvalue()
    assert "ALTER TABLE meal_reviews ADD COLUMN goal_feedback VARCHAR(20)" in output.getvalue()
    assert "UPDATE" not in output.getvalue()


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
def test_boolean_feedback_migration_generates_conversion_sql():
    migration = run_path(str(MIGRATIONS / "versions" / "20261019_1300_boolean_feedback.py"))
    assert migration["down_revision"] == "0005_remove_exposure"
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    with Operations.context(context):
        migration["upgrade"]()
    sql = output.getvalue()
    assert "UPDATE meal_reviews" in sql
    assert "jsonb_each(meal_reviews.suggestion_feedback::jsonb)" in sql
    assert "'{\"tried\": true}'::jsonb" in sql
    assert "'{\"tried\": false}'::jsonb" in sql
    assert "ELSE value" in sql
    output.seek(0)
    output.truncate()
    with Operations.context(context):
        migration["downgrade"]()
    assert "value -> 'tried' = 'true'::jsonb" in output.getvalue()
    assert "value -> 'tried' = 'false'::jsonb" in output.getvalue()
