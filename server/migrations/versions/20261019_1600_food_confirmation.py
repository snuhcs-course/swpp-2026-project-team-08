# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선

"""Separate food provenance from parent confirmation."""

import sqlalchemy as sa
from alembic import op

revision = "0009_food_confirmation"
down_revision = "0008_remove_food_traits"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "meal_foods",
        sa.Column("confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Capture the old confirmation state before restoring original provenance.
    op.execute("UPDATE meal_foods SET confirmed = (source = 'parent')")
    op.execute("UPDATE meal_foods SET source = COALESCE(origin, source)")
    op.drop_column("meal_foods", "origin")
    op.alter_column("meal_foods", "confirmed", server_default=None)


def downgrade():
    op.add_column("meal_foods", sa.Column("origin", sa.String(length=20), nullable=True))
    op.execute("UPDATE meal_foods SET origin = source")
    op.execute("UPDATE meal_foods SET source = 'parent' WHERE confirmed = true")
    op.drop_column("meal_foods", "confirmed")
