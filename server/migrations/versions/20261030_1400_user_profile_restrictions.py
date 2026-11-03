# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 프로필 제한을 restrictions 목록으로 합치고 안전 음식 테이블 이름 변경

"""자녀 프로필의 제한을 restrictions 목록 하나로 합치고 안전 음식 테이블을 새로 만든다.

- allergy_status, restriction_status, safe_food_status 를 삭제하고 restrictions(JSONB) 를 추가한다.
- age_group 의 CHECK 제약을 삭제한다 (값은 AgeGroup StrEnum 이 검증한다).
- user_profile_choices 를 삭제한다 (알러지·제한·선호 음식 선택).
- safe_foods 를 삭제하고 position 없이 user_profile_safe_foods 를 만든다.

기존 프로필 데이터는 이관하지 않고 버린다. 모든 사용자가 프로필을 다시 입력해야 한다.
users, user_consents, 식사·추천 기록은 유지한다.
downgrade 는 옛 구조를 빈 상태로 되돌리며 user_profiles 의 행은 삭제되고 복구되지 않는다.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0022_user_profile_restrictions"
down_revision = "0021_consent_kind_enum"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("user_profile_choices")
    op.drop_table("safe_foods")
    op.execute("DELETE FROM user_profiles")
    for name in (
        "ck_user_profiles_age_group",
        "ck_user_profiles_child_name",
        "ck_user_profiles_allergy_status",
        "ck_user_profiles_restriction_status",
        "ck_user_profiles_safe_food_status",
    ):
        op.drop_constraint(name, "user_profiles", type_="check")
    op.drop_column("user_profiles", "allergy_status")
    op.drop_column("user_profiles", "restriction_status")
    op.drop_column("user_profiles", "safe_food_status")
    op.alter_column(
        "user_profiles",
        "age_group",
        type_=sa.String(length=20),
        existing_type=sa.String(),
        existing_nullable=False,
    )
    # 행을 모두 지운 뒤라 기본값 없이 NOT NULL 컬럼을 추가할 수 있다.
    op.add_column("user_profiles", sa.Column("restrictions", JSONB(), nullable=False))

    op.create_table(
        "user_profile_safe_foods",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("preparation", sa.String(), nullable=False),
        sa.Column("presentation_note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["user_profiles.user_id"], onupdate="CASCADE", ondelete="CASCADE"
        ),
    )
    op.create_index("ix_user_profile_safe_foods_user_id", "user_profile_safe_foods", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_profile_safe_foods")
    # 상태 컬럼은 NOT NULL 이고 되돌릴 값이 없으므로 행을 먼저 지운다.
    op.execute("DELETE FROM user_profiles")
    op.drop_column("user_profiles", "restrictions")
    op.alter_column(
        "user_profiles",
        "age_group",
        type_=sa.String(),
        existing_type=sa.String(length=20),
        existing_nullable=False,
    )
    op.add_column("user_profiles", sa.Column("allergy_status", sa.String(), nullable=False))
    op.add_column("user_profiles", sa.Column("restriction_status", sa.String(), nullable=False))
    op.add_column("user_profiles", sa.Column("safe_food_status", sa.String(), nullable=False))
    op.create_check_constraint(
        "ck_user_profiles_age_group",
        "user_profiles",
        "age_group IN ('under-2','2-3','4-5','6-8','9-12','13-plus')",
    )
    op.create_check_constraint(
        "ck_user_profiles_child_name", "user_profiles", "trim(child_name) <> ''"
    )
    op.create_check_constraint(
        "ck_user_profiles_allergy_status",
        "user_profiles",
        "allergy_status IN ('unknown','none_known','specified')",
    )
    op.create_check_constraint(
        "ck_user_profiles_restriction_status",
        "user_profiles",
        "restriction_status IN ('none','specified')",
    )
    op.create_check_constraint(
        "ck_user_profiles_safe_food_status",
        "user_profiles",
        "safe_food_status IN ('none','listed')",
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
            "category IN ('allergy','restriction','family_food')",
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
