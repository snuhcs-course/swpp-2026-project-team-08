# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: users 의 이메일 변경 컬럼을 user_email_change_attempts 로 분리

"""users 의 이메일 변경 컬럼 3개를 user_email_change_attempts 테이블로 분리한다.

만료되지 않은 진행 중 요청만 새 테이블로 옮기고, 만료됐거나 일부만 채워진 요청은 버린다.
downgrade 도 만료되지 않은 시도만 users 로 되돌린다.
"""

import sqlalchemy as sa
from alembic import op

revision = "0018_user_email_change_attempts"
down_revision = "0017_meal_ingredients"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_email_change_attempts",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("new_email", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], onupdate="CASCADE", ondelete="CASCADE"),
    )
    # 만료되지 않은 요청만 옮긴다. 인증 코드는 해시 그대로 복사한다.
    op.execute(
        """
        INSERT INTO user_email_change_attempts
            (user_id, new_email, code_hash, expires_at, created_at, updated_at)
        SELECT id, pending_email, email_change_code_hash, email_change_expires_at, now(), now()
        FROM users
        WHERE pending_email IS NOT NULL
          AND email_change_code_hash IS NOT NULL
          AND email_change_expires_at IS NOT NULL
          AND email_change_expires_at > now()
        """
    )
    op.drop_column("users", "email_change_expires_at")
    op.drop_column("users", "email_change_code_hash")
    op.drop_column("users", "pending_email")


def downgrade() -> None:
    op.add_column("users", sa.Column("pending_email", sa.String(length=255), nullable=True))
    op.add_column(
        "users", sa.Column("email_change_code_hash", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "users", sa.Column("email_change_expires_at", sa.DateTime(timezone=True), nullable=True)
    )
    # 만료되지 않은 시도만 되돌린다. 만료된 시도는 복구되지 않는다.
    op.execute(
        """
        UPDATE users
        SET pending_email = a.new_email,
            email_change_code_hash = a.code_hash,
            email_change_expires_at = a.expires_at
        FROM user_email_change_attempts AS a
        WHERE a.user_id = users.id AND a.expires_at > now()
        """
    )
    op.drop_table("user_email_change_attempts")
