# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Remove food item traits, preserving after-meal rejection reasons.

Downgrade restores empty objects; removed trait values cannot be recovered.
"""

import sqlalchemy as sa
from alembic import op

revision = "0008_remove_food_traits"
down_revision = "0007_remove_food_history"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("meal_foods", "traits")


def downgrade():
    op.add_column(
        "meal_foods",
        sa.Column("traits", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.alter_column("meal_foods", "traits", server_default=None)
