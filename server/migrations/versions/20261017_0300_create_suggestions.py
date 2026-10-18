# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""Persist recommendation snapshots, decisions, and try history."""

import sqlalchemy as sa
from alembic import op

revision = "0003_create_suggestions"
down_revision = "0002_create_meal_logs"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "suggestion_batches",
        sa.Column("id", sa.String(length=80), nullable=False, primary_key=True),
        sa.Column("child_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("meal_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("revision", sa.String(length=64), nullable=False, primary_key=False),
        sa.Column("selected_food_ids", sa.JSON(), nullable=False, primary_key=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
    )
    op.create_index("ix_suggestion_batches_meal_id", "suggestion_batches", ["meal_id"])
    op.create_index("ix_suggestion_batches_child_id", "suggestion_batches", ["child_id"])
    op.create_table(
        "suggestions",
        sa.Column("id", sa.String(length=80), nullable=False, primary_key=True),
        sa.Column("child_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("batch_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("meal_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("food_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("revision", sa.String(length=64), nullable=False, primary_key=False),
        sa.Column("content", sa.JSON(), nullable=False, primary_key=False),
        sa.Column("status", sa.String(length=20), nullable=False, primary_key=False),
        sa.Column("dismiss_reasons", sa.JSON(), nullable=False, primary_key=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True, primary_key=False),
        sa.Column("version", sa.Integer(), nullable=False, primary_key=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
    )
    op.create_index("ix_suggestions_meal_id", "suggestions", ["meal_id"])
    op.create_index("ix_suggestions_child_id", "suggestions", ["child_id"])
    op.create_index("ix_suggestions_batch_id", "suggestions", ["batch_id"])
    op.create_table(
        "suggestion_actions",
        sa.Column("id", sa.String(length=80), nullable=False, primary_key=True),
        sa.Column(
            "suggestion_id",
            sa.String(length=80),
            sa.ForeignKey("suggestions.id", onupdate="CASCADE", ondelete="CASCADE"),
            nullable=False,
            primary_key=False,
        ),
        sa.Column("before", sa.JSON(), nullable=False, primary_key=False),
        sa.Column("after_version", sa.Integer(), nullable=False, primary_key=False),
        sa.Column("undone", sa.Boolean(), nullable=False, primary_key=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
    )
    op.create_index("ix_suggestion_actions_suggestion_id", "suggestion_actions", ["suggestion_id"])
    op.create_table(
        "suggestion_tries",
        sa.Column("id", sa.String(length=80), nullable=False, primary_key=True),
        sa.Column(
            "suggestion_id",
            sa.String(length=80),
            sa.ForeignKey("suggestions.id", onupdate="CASCADE", ondelete="CASCADE"),
            nullable=False,
            primary_key=False,
        ),
        sa.Column("meal_id", sa.String(length=80), nullable=False, primary_key=False),
        sa.Column("target_id", sa.String(length=200), nullable=False, primary_key=False),
        sa.Column("tried_on", sa.Date(), nullable=False, primary_key=False),
        sa.Column("feedback", sa.String(length=20), nullable=True, primary_key=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, primary_key=False),
        sa.UniqueConstraint("suggestion_id", "meal_id", "target_id"),
    )
    op.create_index("ix_suggestion_tries_suggestion_id", "suggestion_tries", ["suggestion_id"])
    op.create_index("ix_suggestion_tries_meal_id", "suggestion_tries", ["meal_id"])


def downgrade():
    op.drop_table("suggestion_tries")
    op.drop_table("suggestion_actions")
    op.drop_table("suggestions")
    op.drop_table("suggestion_batches")
