# AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
# Changed: 추천 상태를 보존하는 저장 목록 제거 시각 추가

"""기존 추천은 목록에 유지하며 이후 보관 해제를 별도로 기록한다."""

import sqlalchemy as sa
from alembic import op

revision = "0028_saved_suggestion_removal"
down_revision = "0027_safe_foods_answer"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "food_recommendations",
        sa.Column("removed_from_saved_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("food_recommendations", "removed_from_saved_at")
