# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""Add explicit ingredient restriction decisions, preserving existing ingredient IDs."""

import sqlalchemy as sa
from alembic import op

revision = "0015_ingredient_restrictions"
down_revision = "0014_contract_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ingredients", sa.Column("eng_name", sa.String(), nullable=True))
    op.create_table(
        "restrictions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("trim(id) <> ''", name="ck_restrictions_id"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_restrictions_name"),
        sa.CheckConstraint("type IN ('ALLERGY','DIET','APPROACH')", name="ck_restrictions_type"),
    )
    op.create_table(
        "ingredient_restrictions",
        sa.Column(
            "ingredient_id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True
        ),
        sa.Column("restriction_id", sa.String(), primary_key=True),
        sa.Column("relation", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ingredient_id"], ["ingredients.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["restriction_id"], ["restrictions.id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "relation IN ('ALWAYS','NEVER','DEPENDS_ON_PRODUCT')",
            name="ck_ingredient_restrictions_relation",
        ),
    )


def downgrade() -> None:
    op.drop_table("ingredient_restrictions")
    op.drop_table("restrictions")
    op.drop_column("ingredients", "eng_name")
