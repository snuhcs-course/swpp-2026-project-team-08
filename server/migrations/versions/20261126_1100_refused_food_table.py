# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: 거부 음식 데이터를 별도 테이블로 이동
"""Move refused food profiles from JSON to individual rows."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0034_refused_food_table"
down_revision = "0033_remove_safe_foods"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_profile_refused_foods",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("user_profiles.user_id", ondelete="CASCADE", onupdate="CASCADE"),
            nullable=False,
        ),
        sa.Column("client_id", sa.String(200), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("cooking_method", sa.String(30), nullable=True),
        sa.Column("reasons", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "client_id"),
    )
    op.create_index(
        "ix_user_profile_refused_foods_user_id", "user_profile_refused_foods", ["user_id"]
    )
    op.execute("""
        INSERT INTO user_profile_refused_foods
            (user_id, client_id, position, name, cooking_method, reasons, created_at, updated_at)
        SELECT p.user_id, food.item->>'id', food.ordinality - 1, food.item->>'name',
            food.item->>'cooking_method', food.item->'reasons', p.created_at, p.updated_at
        FROM user_profiles p
        CROSS JOIN LATERAL jsonb_array_elements(p.refused_foods)
            WITH ORDINALITY AS food(item, ordinality)
    """)
    op.drop_column("user_profiles", "refused_foods")


def downgrade() -> None:
    op.add_column("user_profiles", sa.Column("refused_foods", postgresql.JSONB(), nullable=True))
    op.execute("""
        UPDATE user_profiles p SET refused_foods = foods.items
        FROM (
            SELECT user_id, jsonb_agg(jsonb_build_object(
                'id', client_id, 'name', name, 'cooking_method', cooking_method, 'reasons', reasons
            ) ORDER BY position) AS items
            FROM user_profile_refused_foods GROUP BY user_id
        ) foods WHERE foods.user_id = p.user_id
    """)
    op.drop_table("user_profile_refused_foods")
