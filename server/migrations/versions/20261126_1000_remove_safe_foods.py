# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 저장소 제거
"""Remove obsolete safe food profile data."""

import sqlalchemy as sa
from alembic import op

revision = "0033_remove_safe_foods"
down_revision = "0032_refused_foods"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("user_profile_safe_foods")
    op.drop_column("user_profiles", "no_safe_foods")


def downgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("no_safe_foods", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_table(
        "user_profile_safe_foods",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("user_profiles.user_id", ondelete="CASCADE", onupdate="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("preparation", sa.String(), nullable=True),
        sa.Column("presentation_note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_profile_safe_foods_user_id", "user_profile_safe_foods", ["user_id"])
