"""Complete the documented meal, review, and suggestion tables."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0014_contract_schema"
down_revision = "0013_authenticated_meals"
branch_labels = None
depends_on = None


def _new_link_table() -> None:
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
            ["ingredient_id"], ["ingredients.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
    )


def upgrade() -> None:
    # Superseded UUID tables contain no data that needs to be retained.
    op.drop_table("suggestion_meal_links")
    for table in (
        "suggestion_tries",
        "suggestion_actions",
        "suggestions",
        "suggestion_batches",
        "meal_suggestions",
        "meal_reviews",
        "legacy_meal_foods",
        "meal_logs",
    ):
        op.drop_table(table)

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
    _new_link_table()

    op.create_check_constraint("ck_meals_id_positive", "meals", "id > 0")
    op.create_check_constraint(
        "ck_meals_meal_type", "meals", "meal_type IN ('breakfast','lunch','dinner','snack')"
    )
    op.create_check_constraint(
        "ck_meals_setting", "meals", "setting IN ('home','restaurant','school','others')"
    )
    op.create_check_constraint("ck_meal_foods_id_positive", "meal_foods", "id > 0")
    op.create_check_constraint("ck_meal_foods_name", "meal_foods", "trim(name) <> ''")
    op.create_check_constraint(
        "ck_meal_foods_cooking_method",
        "meal_foods",
        "cooking_method IS NULL OR cooking_method IN ('raw','boiled','steamed',"
        "'pan_fried','stir_fried','baked_roasted','mashed_blended','other')",
    )
    op.create_check_constraint(
        "ck_meal_foods_acceptance", "meal_foods", "acceptance IS NULL OR acceptance BETWEEN 0 AND 3"
    )
    op.alter_column("meal_foods", "acceptance", type_=sa.SmallInteger(), existing_type=sa.Integer())
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)


def downgrade() -> None:
    raise NotImplementedError("The discarded UUID meal and suggestion tables cannot be restored")
