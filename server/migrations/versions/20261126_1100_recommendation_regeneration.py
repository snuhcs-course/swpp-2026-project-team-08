# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 추천에 재생성 요청 ID와 계정별 고유 인덱스 추가

"""재생성 요청 하나에 계정별로 추천 하나를 저장한다."""

import sqlalchemy as sa
from alembic import op

revision = "0032_recommendation_regeneration"
down_revision = "0031_recommendation_food_name"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("food_recommendations", sa.Column("regeneration_request_id", sa.Uuid()))
    op.create_index(
        "uq_recommendation_regeneration_request",
        "food_recommendations",
        ["user_id", "regeneration_request_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_recommendation_regeneration_request", table_name="food_recommendations")
    op.drop_column("food_recommendations", "regeneration_request_id")
