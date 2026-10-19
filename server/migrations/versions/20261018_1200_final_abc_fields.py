# AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
"""Preserve food acceptance and pending/confirmed suggestion links."""

import sqlalchemy as sa
from alembic import op

revision = "0004_final_abc_fields"
down_revision = "0003_create_suggestions"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("meal_foods", sa.Column("acceptance", sa.Integer(), nullable=True))
    op.add_column("meal_foods", sa.Column("origin", sa.String(length=20), nullable=True))
    op.add_column(
        "meal_logs",
        sa.Column("suggestion_links", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    op.add_column(
        "meal_reviews",
        sa.Column("suggestion_feedback", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )


def downgrade():
    op.drop_column("meal_reviews", "suggestion_feedback")
    op.drop_column("meal_logs", "suggestion_links")
    op.drop_column("meal_foods", "origin")
    op.drop_column("meal_foods", "acceptance")
