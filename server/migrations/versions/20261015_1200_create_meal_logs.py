# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
"""create meal log tables

Revision ID: 0002_create_meal_logs
Revises: 0001_create_users
Create Date: 2026-10-15

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_create_meal_logs"
down_revision: str | None = "0001_create_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "meal_logs",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("child_id", sa.String(length=80), nullable=False),
        sa.Column("meal_date", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(length=20), nullable=False),
        sa.Column("setting", sa.String(length=20), nullable=False),
        sa.Column("before_photo_uri", sa.Text(), nullable=True),
        sa.Column("exposure_food_id", sa.String(length=80), nullable=True),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meal_logs_child_id", "meal_logs", ["child_id"], unique=False)
    op.create_index("ix_meal_logs_meal_date", "meal_logs", ["meal_date"], unique=False)

    op.create_table(
        "meal_foods",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("meal_id", sa.String(length=80), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("preparation", sa.Text(), nullable=False),
        sa.Column("serving_note", sa.Text(), nullable=False),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("traits", sa.JSON(), nullable=False),
        sa.Column("history", sa.String(length=20), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["meal_id"],
            ["meal_logs.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("meal_id", "id"),
    )
    op.create_index("ix_meal_foods_meal_id", "meal_foods", ["meal_id"], unique=False)

    op.create_table(
        "meal_reviews",
        sa.Column("meal_id", sa.String(length=80), nullable=False),
        sa.Column("after_photo_uri", sa.Text(), nullable=False),
        sa.Column("outcomes", sa.JSON(), nullable=False),
        sa.Column("difficulties", sa.JSON(), nullable=False),
        sa.Column("goal_feedback", sa.String(length=20), nullable=True),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["meal_id"],
            ["meal_logs.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("meal_id"),
    )

    op.create_table(
        "meal_suggestions",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("meal_id", sa.String(length=80), nullable=False),
        sa.Column("food_id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("serving_tip", sa.Text(), nullable=True),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["meal_id"],
            ["meal_logs.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meal_suggestions_meal_id", "meal_suggestions", ["meal_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_meal_suggestions_meal_id", table_name="meal_suggestions")
    op.drop_table("meal_suggestions")
    op.drop_table("meal_reviews")
    op.drop_index("ix_meal_foods_meal_id", table_name="meal_foods")
    op.drop_table("meal_foods")
    op.drop_index("ix_meal_logs_meal_date", table_name="meal_logs")
    op.drop_index("ix_meal_logs_child_id", table_name="meal_logs")
    op.drop_table("meal_logs")
