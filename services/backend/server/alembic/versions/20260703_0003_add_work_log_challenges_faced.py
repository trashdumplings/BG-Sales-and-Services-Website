"""add challenges_faced to work logs

Revision ID: 20260703_0003
Revises: 20260703_0002
Create Date: 2026-07-03
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260703_0003"
down_revision = "20260703_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            ALTER TABLE work_logs
            ADD COLUMN IF NOT EXISTS challenges_faced TEXT NULL
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE work_logs DROP COLUMN IF EXISTS challenges_faced"))
