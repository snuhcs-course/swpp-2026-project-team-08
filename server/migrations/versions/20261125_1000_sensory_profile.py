# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 감각 프로필 컬럼 추가
"""Store optional sensory profile answers."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0031_sensory_profile"
down_revision = "0030_merge_ingredient_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column(
            "sensory_textures",
            sa.JSON().with_variant(postgresql.JSONB, "postgresql"),
            nullable=True,
        ),
    )
    op.add_column("user_profiles", sa.Column("sensory_note", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_profiles", "sensory_note")
    op.drop_column("user_profiles", "sensory_textures")
