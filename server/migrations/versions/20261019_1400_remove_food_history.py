# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Remove the retired per-food acceptance history field.

Downgrade restores an empty nullable column; removed values cannot be recovered.
"""

import sqlalchemy as sa
from alembic import op

revision = "0007_remove_food_history"
down_revision = "0006_boolean_feedback"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("meal_foods", "history")


def downgrade():
    op.add_column("meal_foods", sa.Column("history", sa.String(length=20), nullable=True))
