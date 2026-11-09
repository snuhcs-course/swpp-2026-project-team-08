# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 추가 추천 이력 테이블 마이그레이션

"""최초 거절과 추가 생성 결과를 보존한다. 과거 거절 이력은 추정하지 않는다."""

import sqlalchemy as sa
from alembic import op

revision = "0026_recommendation_retry"
down_revision = "0025_dietary_pattern"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "food_recommendation_retries",
        sa.Column("food_id", sa.BigInteger(), primary_key=True),
        sa.Column("dismissed_id", sa.BigInteger(), nullable=False, unique=True),
        sa.Column("replacement_id", sa.BigInteger(), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["food_id"], ["meal_foods.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["dismissed_id"], ["food_recommendations.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["replacement_id"], ["food_recommendations.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
    )


def downgrade() -> None:
    op.drop_table("food_recommendation_retries")
