# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Preserve meal ingredient IDs in a separate check-in store
"""Separate check-in ingredients while preserving existing IDs and catalog data."""

import sqlalchemy as sa
from alembic import op

revision = "0017_meal_ingredients"
down_revision = "0016_remove_profile_questions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    ingredients = op.create_table(
        "meal_ingredients",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("normalized_name", sa.String(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("id > 0", name="ck_meal_ingredients_id_positive"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_meal_ingredients_name"),
        sa.UniqueConstraint("name", name="uq_meal_ingredients_name"),
    )
    connection = op.get_bind()
    catalog = sa.table(
        "ingredients",
        sa.column("id", sa.BigInteger()),
        sa.column("name", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    rows = connection.execute(sa.select(catalog).order_by(catalog.c.id)).mappings()
    for row in rows:
        connection.execute(
            ingredients.insert().values(
                **row, normalized_name=" ".join(row["name"].split()).casefold()
            )
        )
    for table in ("meal_food_ingredients", "suggestion_meal_links"):
        with op.batch_alter_table(
            table,
            naming_convention={"fk": "%(table_name)s_%(column_0_name)s_fkey"},
        ) as batch:
            batch.drop_constraint(f"{table}_ingredient_id_fkey", type_="foreignkey")
            batch.create_foreign_key(
                f"{table}_ingredient_id_fkey",
                "meal_ingredients",
                ["ingredient_id"],
                ["id"],
                onupdate="CASCADE",
                ondelete="CASCADE",
            )


def downgrade() -> None:
    raise NotImplementedError(
        "Meal ingredients cannot be merged into the shared catalog automatically"
    )
