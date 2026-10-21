"""Add one child profile, ordered choices, safe foods, and consent history."""

import sqlalchemy as sa
from alembic import op

revision = "0011_onboarding"
down_revision = "0010_bigint_user_ids"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("child_name", sa.String(), nullable=False),
        sa.Column("age_group", sa.String(), nullable=False),
        sa.Column("allergy_status", sa.String(), nullable=False),
        sa.Column("restriction_status", sa.String(), nullable=False),
        sa.Column("smell_sensitivity", sa.String(), nullable=True),
        sa.Column("preferred_temperature", sa.String(), nullable=True),
        sa.Column("new_food_response", sa.String(), nullable=True),
        sa.Column("safe_food_status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("trim(child_name) <> ''", name="ck_user_profiles_child_name"),
        sa.CheckConstraint(
            "age_group IN ('under-2','2-3','4-5','6-8','9-12','13-plus')",
            name="ck_user_profiles_age_group",
        ),
        sa.CheckConstraint(
            "allergy_status IN ('unknown','none_known','specified')",
            name="ck_user_profiles_allergy_status",
        ),
        sa.CheckConstraint(
            "restriction_status IN ('none','specified')",
            name="ck_user_profiles_restriction_status",
        ),
        sa.CheckConstraint(
            "safe_food_status IN ('none','listed')", name="ck_user_profiles_safe_food_status"
        ),
    )
    op.create_table(
        "user_profile_choices",
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("user_profiles.user_id", onupdate="CASCADE", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("category", sa.String(), primary_key=True),
        sa.Column("position", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(), nullable=True),
        sa.Column("custom_name", sa.String(), nullable=True),
        sa.CheckConstraint("position >= 0", name="ck_user_profile_choices_position"),
        sa.CheckConstraint(
            "(code IS NULL) <> (custom_name IS NULL)", name="ck_user_profile_choices_value"
        ),
        sa.CheckConstraint(
            "category IN ('allergy','restriction','family_food','dietary_approach',"
            "'difficult_texture','difficult_taste','presentation_preference')",
            name="ck_user_profile_choices_category",
        ),
        sa.CheckConstraint("code IS NULL OR trim(code) <> ''", name="ck_user_profile_choices_code"),
        sa.CheckConstraint(
            "custom_name IS NULL OR trim(custom_name) <> ''",
            name="ck_user_profile_choices_custom_name",
        ),
        sa.UniqueConstraint("user_id", "category", "code", name="uq_user_profile_choices_code"),
        sa.UniqueConstraint(
            "user_id", "category", "custom_name", name="uq_user_profile_choices_custom_name"
        ),
    )
    op.create_table(
        "safe_foods",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("user_profiles.user_id", onupdate="CASCADE", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("preparation", sa.String(), nullable=False),
        sa.Column("presentation_note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("position >= 0", name="ck_safe_foods_position"),
        sa.CheckConstraint("trim(name) <> ''", name="ck_safe_foods_name"),
        sa.CheckConstraint("trim(preparation) <> ''", name="ck_safe_foods_preparation"),
        sa.UniqueConstraint("user_id", "position", name="uq_safe_foods_user_position"),
    )
    op.create_table(
        "user_consents",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("granted", sa.Boolean(), nullable=False),
        sa.Column("document_version", sa.String(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "kind IN ('account_privacy','photo_analysis','ai_training')",
            name="ck_user_consents_kind",
        ),
        sa.CheckConstraint("trim(document_version) <> ''", name="ck_user_consents_version"),
    )
    op.create_index("ix_user_consents_user_kind", "user_consents", ["user_id", "kind"])


def downgrade() -> None:
    op.drop_index("ix_user_consents_user_kind", table_name="user_consents")
    op.drop_table("user_consents")
    op.drop_table("safe_foods")
    op.drop_table("user_profile_choices")
    op.drop_table("user_profiles")
