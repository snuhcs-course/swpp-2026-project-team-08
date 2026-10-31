# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: suggestions 를 food_recommendations 로 재편하고 추천 시도 기록 테이블 추가

"""추천 테이블을 음식 단위 구조로 재편한다.

- suggestions 를 삭제하고 food_recommendations 를 만든다.
  meal_id, ingredient_id, food_snapshot 이 사라지고
  food_id 는 origin_food_id(meal_foods.id 를 참조)가 된다.
  ingredients, cooking_method, causes 가 추가된다.
- 추천 시도 기록 food_recommendation_tries 를 만든다 (이전의 suggestion_meal_links 를 대체).
- 값 규칙 CHECK 제약은 만들지 않는다. 허용 값은 애플리케이션(StrEnum, DTO)이 검증한다.

기존 추천 데이터는 0020 에서 이미 삭제되었으므로 이관하지 않는다.
downgrade 는 옛 구조의 suggestions 를 빈 상태로 다시 만들며 데이터는 복구되지 않는다.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0024_food_recommendations"
down_revision = "0023_ingredient_restrictions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("suggestions")
    op.create_table(
        "food_recommendations",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("origin_food_id", sa.BigInteger(), nullable=False),
        sa.Column("what_to_try", sa.Text(), nullable=False),
        sa.Column("why_this_may_help", sa.Text(), nullable=False),
        sa.Column("serving_tip", sa.Text(), nullable=True),
        sa.Column("ingredients", JSONB(), nullable=False),
        sa.Column("cooking_method", sa.String(length=30), nullable=False),
        sa.Column("causes", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "dismiss_reasons", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], onupdate="CASCADE", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["origin_food_id"], ["meal_foods.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
    )
    op.create_index("ix_food_recommendations_user_id", "food_recommendations", ["user_id"])
    op.create_index(
        "ix_food_recommendations_origin_food_id", "food_recommendations", ["origin_food_id"]
    )
    op.create_table(
        "food_recommendation_tries",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("food_recommendation_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("feedback", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["food_recommendation_id"],
            ["food_recommendations.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["food_id"], ["meal_foods.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "food_recommendation_id", "food_id", name="uq_food_recommendation_tries_pair"
        ),
    )


def downgrade() -> None:
    op.drop_table("food_recommendation_tries")
    op.drop_table("food_recommendations")
    # 0020 직후의 옛 구조(0014 에서 정의)를 빈 상태로 다시 만든다.
    op.create_table(
        "suggestions",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=True),
        sa.Column("food_snapshot", JSONB(), nullable=False),
        sa.Column("what_to_try", sa.Text(), nullable=False),
        sa.Column("why_this_may_help", sa.Text(), nullable=False),
        sa.Column("serving_tip", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column(
            "dismiss_reasons", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], onupdate="CASCADE", ondelete="CASCADE"),
        sa.CheckConstraint("id > 0", name="ck_suggestions_id_positive"),
        sa.CheckConstraint(
            "status IN ('pending','saved','dismissed')", name="ck_suggestions_status"
        ),
        sa.CheckConstraint(
            "(status = 'saved') = (saved_at IS NOT NULL)", name="ck_suggestions_saved_at"
        ),
        sa.CheckConstraint("trim(what_to_try) <> ''", name="ck_suggestions_what_to_try"),
        sa.CheckConstraint(
            "trim(why_this_may_help) <> ''", name="ck_suggestions_why_this_may_help"
        ),
    )
    op.create_index("ix_suggestions_user_id", "suggestions", ["user_id"])
