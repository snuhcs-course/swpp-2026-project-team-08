# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 컬럼 추가, 익숙한 음식의 조리 방법을 NULL 허용으로 변경

"""user_profiles 에 식생활 유형을 추가하고 익숙한 음식의 조리 방법을 선택 입력으로 바꾼다.

- `user_profiles.dietary_pattern`: `DietaryPattern` 값(대문자). NULL 은 미응답이다.
  허용 값은 DB 가 아니라 애플리케이션(StrEnum, DTO)이 검증한다.
- `user_profile_safe_foods.preparation`: NULL 을 허용한다.

기존 행은 그대로 유지한다.
"""

import sqlalchemy as sa
from alembic import op

revision = "0025_dietary_pattern"
down_revision = "0024_food_recommendations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles", sa.Column("dietary_pattern", sa.String(length=30), nullable=True)
    )
    op.alter_column(
        "user_profile_safe_foods",
        "preparation",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    # NOT NULL 로 되돌리기 전에 비어 있는 조리 방법을 빈 문자열로 채운다.
    op.execute("UPDATE user_profile_safe_foods SET preparation = '' WHERE preparation IS NULL")
    op.alter_column(
        "user_profile_safe_foods",
        "preparation",
        existing_type=sa.String(),
        nullable=False,
    )
    op.drop_column("user_profiles", "dietary_pattern")
