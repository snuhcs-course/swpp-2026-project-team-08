# AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
# Changed: 기존 추천 음식명을 채우고 원본 음식 없는 추천 허용

"""추천에 음식명을 저장하고 원본 식사 음식 연결을 선택값으로 둔다."""

import sqlalchemy as sa
from alembic import op

revision = "0031_recommendation_food_name"
down_revision = "0030_merge_ingredient_catalog"
branch_labels = None
depends_on = None


def _check_sqlite_batch_mode() -> None:
    connection = op.get_bind()
    if (
        connection.dialect.name == "sqlite"
        and connection.exec_driver_sql("PRAGMA foreign_keys").scalar()
    ):
        # SQLite의 테이블 교체가 추천의 시도·재생성 이력을 연쇄 삭제하는 것을 막는다.
        raise RuntimeError("SQLite batch migration requires PRAGMA foreign_keys=OFF before BEGIN")


def upgrade() -> None:
    _check_sqlite_batch_mode()
    op.add_column("food_recommendations", sa.Column("food_name", sa.Text(), nullable=True))
    op.execute(
        "UPDATE food_recommendations SET food_name = meal_foods.name "
        "FROM meal_foods WHERE meal_foods.id = food_recommendations.origin_food_id"
    )
    with op.batch_alter_table("food_recommendations") as batch:
        batch.alter_column("food_name", existing_type=sa.Text(), nullable=False)
        batch.alter_column("origin_food_id", existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    _check_sqlite_batch_mode()
    with op.batch_alter_table("food_recommendations") as batch:
        # 원본이 없는 추천이 있으면 NOT NULL 복원에서 중단해 해당 추천을 보존한다.
        batch.alter_column("origin_food_id", existing_type=sa.BigInteger(), nullable=False)
        batch.drop_column("food_name")
