# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# Changed: Dietary Pattern 선택 및 저장

"""Persist the optional dietary pattern independently of legacy food groups."""

import sqlalchemy as sa
from alembic import op

revision = "0018_dietary_pattern"
down_revision = "0017_meal_ingredients"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("dietary_pattern", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_profiles", "dietary_pattern")
