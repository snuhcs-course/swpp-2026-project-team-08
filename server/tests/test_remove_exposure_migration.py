# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Check migration history and generated SQL without connecting to a database."""

from io import StringIO
from pathlib import Path
from runpy import run_path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
def test_removal_joins_both_existing_heads():
    scripts = ScriptDirectory(str(MIGRATIONS))
    assert scripts.get_heads() == ["0009_food_confirmation"]
    assert set(scripts.get_revision("0005_remove_exposure").down_revision) == {
        "0004_final_abc_fields",
        "0004_user_email_change",
    }


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
def test_food_confirmation_migration_preserves_provenance_before_dropping_origin():
    migration = run_path(str(MIGRATIONS / "versions" / "20261019_1600_food_confirmation.py"))
    assert migration["down_revision"] == "0008_remove_food_traits"
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    with Operations.context(context):
        migration["upgrade"]()
    sql = output.getvalue()
    assert "ADD COLUMN confirmed BOOLEAN DEFAULT false NOT NULL" in sql
    confirmation = sql.index("UPDATE meal_foods SET confirmed = (source = 'parent')")
    provenance = sql.index("UPDATE meal_foods SET source = COALESCE(origin, source)")
    removal = sql.index("DROP COLUMN origin")
    assert confirmation < provenance < removal
    output.seek(0)
    output.truncate()
    with Operations.context(context):
        migration["downgrade"]()
    sql = output.getvalue()
    assert sql.index("SET origin = source") < sql.index("SET source = 'parent'")
    assert "DROP COLUMN confirmed" in sql


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


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
def test_food_history_removal_sql_and_nullable_restore():
    migration = run_path(str(MIGRATIONS / "versions" / "20261019_1400_remove_food_history.py"))
    assert migration["down_revision"] == "0006_boolean_feedback"
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    with Operations.context(context):
        migration["upgrade"]()
    assert output.getvalue().strip() == "ALTER TABLE meal_foods DROP COLUMN history;"
    output.seek(0)
    output.truncate()
    with Operations.context(context):
        migration["downgrade"]()
    assert output.getvalue().strip() == "ALTER TABLE meal_foods ADD COLUMN history VARCHAR(20);"


# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
def test_food_traits_removal_preserves_review_reasons_and_restores_empty_objects():
    migration = run_path(str(MIGRATIONS / "versions" / "20261019_1500_remove_food_traits.py"))
    assert migration["down_revision"] == "0007_remove_food_history"
    output = StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
    )
    with Operations.context(context):
        migration["upgrade"]()
    assert output.getvalue().strip() == "ALTER TABLE meal_foods DROP COLUMN traits;"
    output.seek(0)
    output.truncate()
    with Operations.context(context):
        migration["downgrade"]()
    sql = output.getvalue()
    assert "ALTER TABLE meal_foods ADD COLUMN traits JSON DEFAULT '{}' NOT NULL" in sql
    assert "ALTER TABLE meal_foods ALTER COLUMN traits DROP DEFAULT" in sql
    assert "meal_reviews" not in sql
