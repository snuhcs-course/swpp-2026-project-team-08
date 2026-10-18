# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
"""Convert suggestion feedback strings to objects with a boolean tried property."""

from alembic import op

revision = "0006_boolean_feedback"
down_revision = "0005_remove_exposure"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE meal_reviews
        SET suggestion_feedback = (
            SELECT COALESCE(jsonb_object_agg(key,
                CASE value
                    WHEN '"tried"'::jsonb THEN '{"tried": true}'::jsonb
                    WHEN '"notTried"'::jsonb THEN '{"tried": false}'::jsonb
                    ELSE value
                END
            ), '{}'::jsonb)::json
            FROM jsonb_each(meal_reviews.suggestion_feedback::jsonb)
        )
    """)


def downgrade():
    op.execute("""
        UPDATE meal_reviews
        SET suggestion_feedback = (
            SELECT COALESCE(jsonb_object_agg(key,
                CASE
                    WHEN value -> 'tried' = 'true'::jsonb THEN '"tried"'::jsonb
                    WHEN value -> 'tried' = 'false'::jsonb THEN '"notTried"'::jsonb
                    ELSE value
                END
            ), '{}'::jsonb)::json
            FROM jsonb_each(meal_reviews.suggestion_feedback::jsonb)
        )
    """)
