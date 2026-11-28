# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 프로필 컬럼 추가
"""Store foods refused by the child."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0032_refused_foods"
down_revision = "0031_sensory_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column(
            "refused_foods", sa.JSON().with_variant(postgresql.JSONB, "postgresql"), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "refused_foods")
