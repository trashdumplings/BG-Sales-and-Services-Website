from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models import CatalogProduct


def get_catalog_product_by_id(db: Session, product_id: int):
    return db.get(CatalogProduct, product_id)


def get_catalog_product_by_slug(db: Session, slug: str, *, published_only: bool = False):
    query = db.query(CatalogProduct).filter(CatalogProduct.slug == slug)
    if published_only:
        query = query.filter(CatalogProduct.is_published.is_(True))
    return query.first()


def get_catalog_product_by_sku(db: Session, sku: str):
    return db.query(CatalogProduct).filter(CatalogProduct.sku == sku).first()


def list_public_catalog_products(db: Session, *, category: str | None = None, search: str | None = None):
    query = db.query(CatalogProduct).filter(CatalogProduct.is_published.is_(True))
    if category:
        query = query.filter(CatalogProduct.category == category)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CatalogProduct.title.ilike(term),
                CatalogProduct.brand.ilike(term),
                CatalogProduct.sku.ilike(term),
                CatalogProduct.short_description.ilike(term),
            )
        )
    return query.order_by(CatalogProduct.featured.desc(), CatalogProduct.created_at.desc()).all()


def list_catalog_products(db: Session):
    return db.query(CatalogProduct).order_by(CatalogProduct.updated_at.desc()).all()

