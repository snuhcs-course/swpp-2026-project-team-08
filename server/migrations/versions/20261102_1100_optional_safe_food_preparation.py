# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# Changed: 익숙한 음식의 빈 조리 방법 허용

"""Allow safe foods with no optional cooking method."""

from alembic import op

revision = "0019_optional_safe_food_prep"
down_revision = "0018_dietary_pattern"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_safe_foods_preparation", "safe_foods", type_="check")


def downgrade() -> None:
    op.create_check_constraint("ck_safe_foods_preparation", "safe_foods", "trim(preparation) <> ''")
