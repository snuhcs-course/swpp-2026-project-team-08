# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 익숙한 음식 명시적 없음 저장 컬럼 추가

"""기존 빈 목록의 응답 의도는 추정하지 않고 미응답으로 유지한다."""

import sqlalchemy as sa
from alembic import op

revision = "0027_safe_foods_answer"
down_revision = "0026_recommendation_retry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("no_safe_foods", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "no_safe_foods")
