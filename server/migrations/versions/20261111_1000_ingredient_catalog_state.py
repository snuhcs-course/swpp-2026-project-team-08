# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 공용 재료 적재 상태 테이블 추가

"""마지막 적재 파일의 해시를 저장한다. 기존 재료 목록은 변경하지 않는다."""

import sqlalchemy as sa
from alembic import op

revision = "0027_ingredient_catalog_state"
down_revision = "0026_recommendation_retry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ingredient_catalog_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("ingredient_catalog_state")
