"""add inventory cms_status and version columns

Revision ID: 20250702_0001
Revises:
Create Date: 2026-07-02
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20250702_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The project originally used SQLAlchemy create_all before adopting Alembic, so
    # the first revision assumed every legacy table already existed. Bootstrap any
    # missing tables first; create_all is check-first and preserves populated tables.
    from server.db import Base
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=op.get_bind())
    op.execute(
        sa.text(
            """
            ALTER TABLE inventory_items
            ADD COLUMN IF NOT EXISTS cms_status VARCHAR(20) NOT NULL DEFAULT 'draft'
            """
        )
    )
    op.execute(
        sa.text(
            """
            ALTER TABLE inventory_items
            ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE inventory_items DROP COLUMN IF EXISTS version"))
    op.execute(sa.text("ALTER TABLE inventory_items DROP COLUMN IF EXISTS cms_status"))
