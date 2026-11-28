# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 홈 화면 추천을 위해 추천의 근거 음식을 선택 값으로 변경

"""홈 화면 추천은 특정 음식에 묶이지 않으므로 `origin_food_id` 를 NULL 로 둘 수 있게 한다.

되돌릴 때는 근거 음식이 없는 추천을 NOT NULL 컬럼에 둘 수 없어서 그 추천을 삭제한다.
시도 기록은 외래 키의 ON DELETE CASCADE 로 함께 삭제된다.
"""

import sqlalchemy as sa
from alembic import op

revision = "0035_optional_recommendation_origin"
down_revision = "0034_refused_food_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "food_recommendations",
        "origin_food_id",
        existing_type=sa.BigInteger(),
        nullable=True,
    )


def downgrade() -> None:
    op.execute("DELETE FROM food_recommendations WHERE origin_food_id IS NULL")
    op.alter_column(
        "food_recommendations",
        "origin_food_id",
        existing_type=sa.BigInteger(),
        nullable=False,
    )
