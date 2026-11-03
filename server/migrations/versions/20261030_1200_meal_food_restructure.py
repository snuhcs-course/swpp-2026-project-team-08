# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 식후 리뷰를 음식·재료 테이블에 합치고 id 를 서버 자동 증가로 재편

"""식사 기록의 음식·재료 구조를 재편한다.

- 식후 리뷰 테이블(review_food_results, review_ingredient_results)을 meal_foods,
  meal_food_ingredients 에 합친다 (outcome, difficulty_reasons).
- meal_foods, meal_food_ingredients 의 id 는 서버가 자동 증가시킨다 (단일 PK).
- 사용자 입력 재료를 공유 이름 테이블(meal_ingredients)이 아니라 음식별 행으로 저장한다.
- 추천 시도 기록(suggestion_meal_links)은 삭제만 하고, 같은 역할의 새 테이블은 0024 에서 만든다.

구조가 크게 달라 기존 데이터를 옛 id 에서 새 id 로 옮기지 않고 버린다.
삭제되는 데이터: 모든 식사, 음식, 재료, 식후 리뷰, 추천, 추천 시도 기록.
downgrade 는 옛 구조의 테이블을 빈 상태로 다시 만들며 삭제된 데이터는 복구되지 않는다.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0020_meal_food_restructure"
down_revision = "0019_meal_enums"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 자식 테이블부터 삭제한다.
    op.drop_table("suggestion_meal_links")
    op.drop_table("review_ingredient_results")
    op.drop_table("review_food_results")
    op.drop_table("meal_food_ingredients")
    op.drop_table("meal_ingredients")
    # 옛 meal_foods 의 행은 meals 를 지우면 함께 삭제된다.
    # 추천은 meals 를 참조하지 않으므로 직접 지운다.
    op.execute("DELETE FROM suggestions")
    op.execute("DELETE FROM meals")
    op.drop_table("meal_foods")

    op.create_table(
        "meal_foods",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("cooking_method", sa.String(length=30), nullable=True),
        sa.Column("serving_note", sa.Text(), nullable=True),
        sa.Column("acceptance", sa.SmallInteger(), nullable=True),
        sa.Column("outcome", sa.String(length=20), nullable=True),
        sa.Column(
            "difficulty_reasons", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["meal_id"], ["meals.id"], onupdate="CASCADE", ondelete="CASCADE"),
    )
    op.create_index("ix_meal_foods_meal_id", "meal_foods", ["meal_id"])
    op.create_table(
        "meal_food_ingredients",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("meal_food_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("outcome", sa.String(length=20), nullable=True),
        sa.Column(
            "difficulty_reasons", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["meal_food_id"], ["meal_foods.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_meal_food_ingredients_meal_food_id", "meal_food_ingredients", ["meal_food_id"]
    )


def downgrade() -> None:
    op.drop_table("meal_food_ingredients")
    op.drop_table("meal_foods")

    # 0019 직후의 옛 구조를 빈 상태로 다시 만든다.
    op.create_table(
        "meal_foods",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("cooking_method", sa.String(length=30), nullable=True),
        sa.Column("serving_note", sa.Text(), nullable=True),
        sa.Column("acceptance", sa.SmallInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("meal_id", "id"),
        sa.ForeignKeyConstraint(["meal_id"], ["meals.id"], onupdate="CASCADE", ondelete="CASCADE"),
        sa.CheckConstraint("id > 0", name="ck_meal_foods_id_positive"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_meal_foods_name"),
        sa.CheckConstraint(
            "acceptance IS NULL OR acceptance BETWEEN 0 AND 3", name="ck_meal_foods_acceptance"
        ),
    )
    op.create_table(
        "meal_ingredients",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("normalized_name", sa.String(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("id > 0", name="ck_meal_ingredients_id_positive"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_meal_ingredients_name"),
        sa.UniqueConstraint("name", name="uq_meal_ingredients_name"),
    )
    op.create_table(
        "meal_food_ingredients",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("meal_id", "food_id", "ingredient_id"),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["meal_ingredients.id"],
            name="meal_food_ingredients_ingredient_id_fkey",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )
    op.create_table(
        "review_food_results",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("food_snapshot", JSONB(), nullable=False),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("difficulties", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.PrimaryKeyConstraint("meal_id", "food_id"),
        sa.ForeignKeyConstraint(["meal_id"], ["meals.id"], onupdate="CASCADE", ondelete="CASCADE"),
        sa.CheckConstraint(
            "outcome IS NULL OR outcome IN ('eaten','tasted','untouched','unclear')",
            name="ck_review_food_results_outcome",
        ),
    )
    op.create_table(
        "review_ingredient_results",
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=False),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("difficulties", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.PrimaryKeyConstraint("meal_id", "food_id", "ingredient_id"),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["review_food_results.meal_id", "review_food_results.food_id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "outcome IS NULL OR outcome IN ('eaten','tasted','untouched','unclear')",
            name="ck_review_ingredient_results_outcome",
        ),
    )
    op.create_table(
        "suggestion_meal_links",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("suggestion_id", sa.BigInteger(), nullable=False),
        sa.Column("meal_id", sa.BigInteger(), nullable=False),
        sa.Column("food_id", sa.BigInteger(), nullable=False),
        sa.Column("ingredient_id", sa.BigInteger(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("suggestion_id", "meal_id"),
        sa.CheckConstraint("id > 0", name="ck_suggestion_meal_links_id_positive"),
        sa.CheckConstraint(
            "feedback IS NULL OR feedback IN ('helpful','not_helpful','not_sure')",
            name="ck_suggestion_meal_links_feedback",
        ),
        sa.ForeignKeyConstraint(
            ["suggestion_id"], ["suggestions.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id"],
            ["meal_foods.meal_id", "meal_foods.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["meal_id", "food_id", "ingredient_id"],
            [
                "meal_food_ingredients.meal_id",
                "meal_food_ingredients.food_id",
                "meal_food_ingredients.ingredient_id",
            ],
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["meal_ingredients.id"],
            name="suggestion_meal_links_ingredient_id_fkey",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
    )
