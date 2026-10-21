"""Separate authenticated meals and store their shared ingredient IDs."""

import sqlalchemy as sa
from alembic import op

revision = "0013_authenticated_meals"
down_revision = "0012_mock_ingredients"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("meal_foods", "legacy_meal_foods")
    op.drop_index("ix_meal_foods_meal_id", table_name="legacy_meal_foods")
    op.create_index("ix_legacy_meal_foods_meal_id", "legacy_meal_foods", ["meal_id"])
    op.create_table(
        "meals",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("meal_date", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(length=20), nullable=False),
        sa.Column("setting", sa.String(length=20), nullable=False),
        sa.Column("before_photo_uri", sa.Text(), nullable=True),
        sa.Column("after_photo_uri", sa.Text(), nullable=True),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], onupdate="CASCADE", ondelete="CASCADE"),
    )
    op.create_index("ix_meals_user_id", "meals", ["user_id"])
    op.create_table(
        "meal_foods",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("cooking_method", sa.String(length=30), nullable=True),
        sa.Column("serving_note", sa.Text(), nullable=True),
        sa.Column("acceptance", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("meal_id", "id"),
        sa.ForeignKeyConstraint(["meal_id"], ["meals.id"], onupdate="CASCADE", ondelete="CASCADE"),
    )
    op.create_table(
        "meal_food_ingredients",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("meal_id", "food_id", "ingredient_id"),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["ingredients.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )
    op.create_table(
        "suggestion_meal_links",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("suggestion_id", sa.String(length=80), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=True),
        sa.Column("feedback", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["suggestion_id"], ["suggestions.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id", "ingredient_id"],
            [
                "meal_food_ingredients.meal_id",
                "meal_food_ingredients.food_id",
                "meal_food_ingredients.ingredient_id",
            ],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"], ["ingredients.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.UniqueConstraint("meal_id", "suggestion_id"),
    )


def downgrade() -> None:
    op.drop_table("suggestion_meal_links")
    op.drop_table("meal_food_ingredients")
    op.drop_table("meal_foods")
    op.drop_index("ix_meals_user_id", table_name="meals")
    op.drop_table("meals")
    op.drop_index("ix_legacy_meal_foods_meal_id", table_name="legacy_meal_foods")
    op.create_index("ix_meal_foods_meal_id", "legacy_meal_foods", ["meal_id"])
    op.rename_table("legacy_meal_foods", "meal_foods")
