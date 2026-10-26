# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선

"""Merge existing heads and remove meal exposure fields.

Upgrade discards stored values. Downgrade restores empty nullable columns.
"""

import sqlalchemy as sa
from alembic import op

revision = "0005_remove_exposure"
down_revision = ("0004_final_abc_fields", "0004_user_email_change")
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("meal_reviews", "goal_feedback")
    op.drop_column("meal_logs", "exposure_food_id")


def downgrade():
    op.add_column("meal_logs", sa.Column("exposure_food_id", sa.String(80), nullable=True))
    op.add_column("meal_reviews", sa.Column("goal_feedback", sa.String(20), nullable=True))
