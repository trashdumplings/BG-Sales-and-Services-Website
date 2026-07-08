"""add work log workflow fields

Revision ID: 20260703_0002
Revises: 20250702_0001
Create Date: 2026-07-03
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260703_0002"
down_revision = "20250702_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) NOT NULL DEFAULT 'draft'
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS reviewed_by_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS reviewer_comment TEXT NULL
            """
        )
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_work_logs_workflow_status ON work_logs (workflow_status)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_work_logs_submitted_at ON work_logs (submitted_at)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_work_logs_reviewed_at ON work_logs (reviewed_at)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_work_logs_reviewed_by_id ON work_logs (reviewed_by_id)"))

    op.execute(
        sa.text(
            """
            UPDATE work_logs
            SET
              workflow_status = CASE
                WHEN is_approved = TRUE THEN 'approved'
                WHEN COALESCE(NULLIF(TRIM(manager_comment), ''), '') <> '' THEN 'rejected'
                ELSE 'submitted'
              END,
              submitted_at = COALESCE(submitted_at, created_at),
              reviewed_at = CASE
                WHEN is_approved = TRUE OR COALESCE(NULLIF(TRIM(manager_comment), ''), '') <> ''
                THEN COALESCE(reviewed_at, updated_at, created_at)
                ELSE reviewed_at
              END,
              reviewed_by_id = COALESCE(reviewed_by_id, approved_by_id),
              reviewer_comment = COALESCE(reviewer_comment, manager_comment)
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS ix_work_logs_reviewed_by_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_work_logs_reviewed_at"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_work_logs_submitted_at"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_work_logs_workflow_status"))
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS reviewer_comment"))
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS reviewed_by_id"))
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS reviewed_at"))
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS submitted_at"))
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS workflow_status"))
