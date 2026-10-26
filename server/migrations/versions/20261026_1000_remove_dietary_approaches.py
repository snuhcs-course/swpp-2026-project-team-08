"""Remove retired profile choices; downgrade cannot recover deleted selections."""

from alembic import op

revision = "0015_remove_dietary_approaches"
down_revision = "0014_contract_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM user_profile_choices WHERE category = 'dietary_approach'")
    op.drop_constraint("ck_user_profile_choices_category", "user_profile_choices", type_="check")
    op.create_check_constraint(
        "ck_user_profile_choices_category",
        "user_profile_choices",
        "category IN ('allergy','restriction','family_food',"
        "'difficult_texture','difficult_taste','presentation_preference')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_user_profile_choices_category", "user_profile_choices", type_="check")
    op.create_check_constraint(
        "ck_user_profile_choices_category",
        "user_profile_choices",
        "category IN ('allergy','restriction','family_food','dietary_approach',"
        "'difficult_texture','difficult_taste','presentation_preference')",
    )
