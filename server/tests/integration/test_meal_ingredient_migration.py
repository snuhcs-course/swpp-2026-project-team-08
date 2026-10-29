# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Verify data preservation and redirected meal ingredient foreign keys
"""Apply the check-in ingredient migration to an isolated legacy schema."""

from datetime import UTC, datetime
from pathlib import Path
from runpy import run_path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


def test_migration_preserves_catalog_and_recorded_ingredient_ids() -> None:
    migration = run_path(
        str(
            Path(__file__).resolve().parents[2]
            / "migrations/versions/20261029_1000_meal_ingredients.py"
        )
    )
    metadata = sa.MetaData()
    catalog = sa.Table(
        "ingredients",
        metadata,
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    for table in ("meal_food_ingredients", "suggestion_meal_links"):
        sa.Table(
            table,
            metadata,
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "ingredient_id",
                sa.BigInteger(),
                sa.ForeignKey("ingredients.id", name=f"{table}_ingredient_id_fkey"),
            ),
        )
    engine = sa.create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            metadata.create_all(connection)
            now = datetime.now(UTC)
            connection.execute(
                catalog.insert(),
                [
                    dict(id=212, name="감자", created_at=now, updated_at=now),
                    dict(id=900, name="My Spice", created_at=now, updated_at=now),
                ],
            )
            for table in ("meal_food_ingredients", "suggestion_meal_links"):
                connection.execute(metadata.tables[table].insert(), {"id": 1, "ingredient_id": 900})
            with Operations.context(MigrationContext.configure(connection)):
                migration["upgrade"]()
            assert connection.execute(
                sa.text("SELECT id, name, normalized_name FROM meal_ingredients ORDER BY id")
            ).all() == [(212, "감자", "감자"), (900, "My Spice", "my spice")]
            assert connection.execute(sa.select(catalog.c.id, catalog.c.name)).all() == [
                (212, "감자"),
                (900, "My Spice"),
            ]
            for table in ("meal_food_ingredients", "suggestion_meal_links"):
                assert (
                    connection.execute(sa.text(f"SELECT ingredient_id FROM {table}")).scalar()
                    == 900
                )
                fk = sa.inspect(connection).get_foreign_keys(table)
                assert fk[0]["referred_table"] == "meal_ingredients"
            assert connection.execute(sa.text("PRAGMA foreign_key_check")).all() == []
    finally:
        engine.dispose()
