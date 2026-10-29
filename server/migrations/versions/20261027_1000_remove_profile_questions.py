# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
"""Remove retired profile answers; downgrade restores schema without deleted answers.

Ship the reduced onboarding model without this revision first. Include this revision
in a subsequent release, after all running server instances use that model.
"""

import sqlalchemy as sa
from alembic import op

revision = "0016_remove_profile_questions"
down_revision = "0015_remove_dietary_approaches"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "DELETE FROM user_profile_choices WHERE category IN "
        "('difficult_texture','difficult_taste','presentation_preference')"
    )
    op.drop_constraint("ck_user_profile_choices_category", "user_profile_choices", type_="check")
    op.create_check_constraint(
        "ck_user_profile_choices_category",
        "user_profile_choices",
        "category IN ('allergy','restriction','family_food')",
    )
    op.drop_column("user_profiles", "smell_sensitivity")
    op.drop_column("user_profiles", "preferred_temperature")
    op.drop_column("user_profiles", "new_food_response")


def downgrade() -> None:
    op.add_column("user_profiles", sa.Column("new_food_response", sa.String(), nullable=True))
    op.add_column("user_profiles", sa.Column("preferred_temperature", sa.String(), nullable=True))
    op.add_column("user_profiles", sa.Column("smell_sensitivity", sa.String(), nullable=True))
    op.drop_constraint("ck_user_profile_choices_category", "user_profile_choices", type_="check")
    op.create_check_constraint(
        "ck_user_profile_choices_category",
        "user_profile_choices",
        "category IN ('allergy','restriction','family_food',"
        "'difficult_texture','difficult_taste','presentation_preference')",
    )
