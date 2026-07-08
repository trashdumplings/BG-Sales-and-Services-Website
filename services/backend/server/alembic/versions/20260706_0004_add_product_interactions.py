"""add product interaction analytics

Revision ID: 20260706_0004
Revises: 20260703_0003
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa


revision = "20260706_0004"
down_revision = "20260703_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_interactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["catalog_products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_interactions_product_id", "product_interactions", ["product_id"])
    op.create_index("ix_product_interactions_event_type", "product_interactions", ["event_type"])
    op.create_index("ix_product_interactions_created_at", "product_interactions", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_product_interactions_created_at", table_name="product_interactions")
    op.drop_index("ix_product_interactions_event_type", table_name="product_interactions")
    op.drop_index("ix_product_interactions_product_id", table_name="product_interactions")
    op.drop_table("product_interactions")
