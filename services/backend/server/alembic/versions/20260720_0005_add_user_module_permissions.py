"""add per-user dashboard module permissions

Revision ID: 20260720_0005
Revises: 20260706_0004
"""
from alembic import op
import sqlalchemy as sa


revision = "20260720_0005"
down_revision = "20260706_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("module_permissions", sa.JSON(), nullable=False, server_default="[]"))


def downgrade() -> None:
    op.drop_column("users", "module_permissions")
