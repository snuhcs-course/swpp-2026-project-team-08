"""Create the shared ingredient catalog with a small mock set."""

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision = "0012_mock_ingredients"
down_revision = "0011_onboarding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    ingredients = op.create_table(
        "ingredients",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("id > 0", name="ck_ingredients_id_positive"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_ingredients_name"),
        sa.UniqueConstraint("name", name="uq_ingredients_name"),
    )
    now = datetime.now(UTC)
    names = (
        (182, "당근"),
        (212, "감자"),
        (213, "달걀"),
        (214, "쌀"),
        (215, "닭고기"),
        (216, "두부"),
        (217, "사과"),
        (218, "브로콜리"),
    )
    op.bulk_insert(
        ingredients,
        [dict(id=ingredient_id, name=name, created_at=now, updated_at=now)
         for ingredient_id, name in names],
    )


def downgrade() -> None:
    op.drop_table("ingredients")
