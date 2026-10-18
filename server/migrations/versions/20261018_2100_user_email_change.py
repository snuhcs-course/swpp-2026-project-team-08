# AI-generated with Grok 4.6, 2026-10-18, reviewed by Doyeon Kim
"""Add pending email-change columns on users."""

import sqlalchemy as sa
from alembic import op

revision = "0004_user_email_change"
down_revision = "0003_create_suggestions"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("pending_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_change_code_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_change_expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("users", "email_change_expires_at")
    op.drop_column("users", "email_change_code_hash")
    op.drop_column("users", "pending_email")
