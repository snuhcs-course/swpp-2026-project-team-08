# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: user_consents.kind 값을 대문자로 바꾸고 값 규칙 CHECK 제약 삭제

"""user_consents.kind 를 StrEnum 값(대문자)으로 바꾸고 값 규칙 CHECK 제약을 삭제한다.

기존 동의 기록은 유지하고 kind 의 저장 값만 소문자에서 대문자로 바꾼다.
허용 값은 DB 가 아니라 애플리케이션(StrEnum, DTO)이 검증한다.
"""

import sqlalchemy as sa
from alembic import op

revision = "0021_consent_kind_enum"
down_revision = "0020_meal_food_restructure"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 소문자만 허용하는 제약이라 값을 바꾸기 전에 먼저 지운다.
    op.drop_constraint("ck_user_consents_kind", "user_consents", type_="check")
    op.drop_constraint("ck_user_consents_version", "user_consents", type_="check")
    op.alter_column(
        "user_consents",
        "kind",
        type_=sa.String(length=30),
        existing_type=sa.String(),
        existing_nullable=False,
    )
    op.execute("UPDATE user_consents SET kind = upper(kind)")


def downgrade() -> None:
    op.execute("UPDATE user_consents SET kind = lower(kind)")
    op.alter_column(
        "user_consents",
        "kind",
        type_=sa.String(),
        existing_type=sa.String(length=30),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "ck_user_consents_kind",
        "user_consents",
        "kind IN ('account_privacy','photo_analysis','ai_training')",
    )
    op.create_check_constraint(
        "ck_user_consents_version", "user_consents", "trim(document_version) <> ''"
    )
