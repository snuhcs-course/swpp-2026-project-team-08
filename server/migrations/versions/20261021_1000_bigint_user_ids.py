"""Replace UUID user IDs with generated BIGINT IDs.

Existing users are discarded as part of the prelaunch schema reset.
"""

import sqlalchemy as sa
from alembic import op

revision = "0010_bigint_user_ids"
down_revision = "0009_food_confirmation"
branch_labels = None
depends_on = None


def _create_users(id_column: sa.Column) -> None:
    op.create_table(
        "users",
        id_column,
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("pending_email", sa.String(length=255), nullable=True),
        sa.Column("email_change_code_hash", sa.String(length=255), nullable=True),
        sa.Column("email_change_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def _drop_users() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")


def upgrade() -> None:
    _drop_users()
    _create_users(sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True))


def downgrade() -> None:
    _drop_users()
    _create_users(sa.Column("id", sa.Uuid(), primary_key=True))
