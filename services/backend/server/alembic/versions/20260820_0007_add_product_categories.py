"""add product categories

Revision ID: 20260820_0007
Revises: 20260810_0006
"""
from alembic import op
import sqlalchemy as sa

revision = "20260820_0007"
down_revision = "20260810_0006"
branch_labels = None
depends_on = None

DEFAULT_CATEGORIES = (
    ("laptop", "Laptops"), ("desktop", "Desktops"), ("printer", "Printers"),
    ("networking", "Networking"), ("audiovisual", "Audio visual"),
    ("power", "Power & UPS"), ("accessories", "Accessories"),
)

def upgrade():
    if not sa.inspect(op.get_bind()).has_table("product_categories"):
        op.create_table(
            "product_categories",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("slug", sa.String(100), nullable=False, unique=True),
            sa.Column("name", sa.String(120), nullable=False, unique=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_product_categories_id", "product_categories", ["id"])
        op.create_index("ix_product_categories_slug", "product_categories", ["slug"], unique=True)
    for slug, name in DEFAULT_CATEGORIES:
        op.execute(
            sa.text("INSERT INTO product_categories (slug, name) VALUES (:slug, :name) ON CONFLICT DO NOTHING")
            .bindparams(slug=slug, name=name)
        )
    op.execute(sa.text("""
        INSERT INTO product_categories (slug, name)
        SELECT DISTINCT category, initcap(replace(category, '-', ' '))
        FROM catalog_products WHERE category IS NOT NULL AND category <> ''
        ON CONFLICT DO NOTHING
    """))

def downgrade():
    op.drop_index("ix_product_categories_slug", table_name="product_categories")
    op.drop_index("ix_product_categories_id", table_name="product_categories")
    op.drop_table("product_categories")
