# AI-generated with GPT-6, 2026-11-17, reviewed by Haechan Jung
# Changed: 식사 장소 미응답을 허용하고 기존 선택값 보존

"""장소를 선택 입력으로 둔다. 되돌릴 때 미응답을 임의 장소로 바꾸지 않는다."""

import sqlalchemy as sa
from alembic import op

revision = "0029_optional_meal_setting"
down_revision = "0028_saved_suggestion_removal"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("meals") as batch:
        batch.alter_column("setting", existing_type=sa.String(length=20), nullable=True)


def downgrade() -> None:
    # 미응답 행이 있으면 DB 제약 검사에서 중단한다. 입력을 추측하거나 삭제하지 않는다.
    with op.batch_alter_table("meals") as batch:
        batch.alter_column("setting", existing_type=sa.String(length=20), nullable=False)
