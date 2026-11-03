# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 식사 enum 값을 대문자로 바꾸고 값 규칙 CHECK 제약 삭제

"""meals, meal_foods 의 enum 컬럼 값을 대문자로 바꾸고 값 규칙 CHECK 제약을 삭제한다.

값의 허용 범위는 DB 가 아니라 애플리케이션(StrEnum, DTO)이 검증한다.
컬럼 타입은 그대로이고 저장 값만 소문자에서 대문자로 바뀐다.
"""

from alembic import op

revision = "0019_meal_enums"
down_revision = "0018_user_email_change_attempts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 소문자만 허용하는 제약이라 값을 바꾸기 전에 먼저 지운다.
    op.drop_constraint("ck_meals_meal_type", "meals", type_="check")
    op.drop_constraint("ck_meals_setting", "meals", type_="check")
    op.drop_constraint("ck_meals_id_positive", "meals", type_="check")
    op.drop_constraint("ck_meal_foods_cooking_method", "meal_foods", type_="check")
    op.execute("UPDATE meals SET meal_type = upper(meal_type), setting = upper(setting)")
    op.execute(
        "UPDATE meal_foods SET cooking_method = upper(cooking_method) "
        "WHERE cooking_method IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("UPDATE meals SET meal_type = lower(meal_type), setting = lower(setting)")
    op.execute(
        "UPDATE meal_foods SET cooking_method = lower(cooking_method) "
        "WHERE cooking_method IS NOT NULL"
    )
    op.create_check_constraint(
        "ck_meals_meal_type", "meals", "meal_type IN ('breakfast','lunch','dinner','snack')"
    )
    op.create_check_constraint(
        "ck_meals_setting", "meals", "setting IN ('home','restaurant','school','others')"
    )
    op.create_check_constraint("ck_meals_id_positive", "meals", "id > 0")
    op.create_check_constraint(
        "ck_meal_foods_cooking_method",
        "meal_foods",
        "cooking_method IS NULL OR cooking_method IN ('raw','boiled','steamed',"
        "'pan_fried','stir_fried','baked_roasted','mashed_blended','other')",
    )
