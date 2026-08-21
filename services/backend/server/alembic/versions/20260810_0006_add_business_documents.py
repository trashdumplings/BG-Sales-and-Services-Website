"""add business documents
Revision ID: 20260810_0006
Revises: 20260720_0005
"""
from alembic import op
import sqlalchemy as sa
revision="20260810_0006"; down_revision="20260720_0005"; branch_labels=None; depends_on=None
def upgrade():
    op.create_table("business_documents", sa.Column("id",sa.Integer(),primary_key=True),sa.Column("company",sa.String(4),nullable=False),sa.Column("document_type",sa.String(20),nullable=False),sa.Column("document_number",sa.String(40),nullable=False,unique=True),sa.Column("issue_date",sa.Date(),nullable=False),sa.Column("status",sa.String(20),nullable=False,server_default="draft"),sa.Column("party_name",sa.String(255),nullable=False),sa.Column("party_details",sa.JSON(),nullable=False),sa.Column("reference",sa.String(500)),sa.Column("currency",sa.String(3),nullable=False),sa.Column("items",sa.JSON(),nullable=False),sa.Column("tax_rate",sa.Numeric(6,3),nullable=False),sa.Column("subtotal",sa.Numeric(14,2),nullable=False),sa.Column("tax_amount",sa.Numeric(14,2),nullable=False),sa.Column("grand_total",sa.Numeric(14,2),nullable=False),sa.Column("terms",sa.Text()),sa.Column("notes",sa.Text()),sa.Column("created_by_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.Column("updated_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
def downgrade(): op.drop_table("business_documents")
