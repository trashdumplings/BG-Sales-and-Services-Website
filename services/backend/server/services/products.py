import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import File, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from ..models import CatalogProduct, ProductCategory
from ..repositories.product_queries import (
    get_catalog_product_by_id,
    get_catalog_product_by_slug,
    get_catalog_product_by_sku,
    list_catalog_products,
    list_public_catalog_products,
)
from ..schemas import CatalogProductCreate, CatalogProductUpdate, ProductCategoryCreate

UPLOAD_DIR = Path(os.getenv("PRODUCT_UPLOAD_DIR", Path(__file__).resolve().parents[1] / "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_SIZE = 5 * 1024 * 1024
IMAGE_SIGNATURES = {
    "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/webp": (".webp", lambda data: len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"),
}
DEFAULT_PRODUCT_CATEGORIES = (
    ("laptop", "Laptops"),
    ("desktop", "Desktops"),
    ("printer", "Printers"),
    ("networking", "Networking"),
    ("audiovisual", "Audio visual"),
    ("power", "Power & UPS"),
    ("accessories", "Accessories"),
)


def make_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "product"


def list_product_categories_service(db: Session):
    # Keep older/create_all databases in sync even when the Alembic data seed was
    # not run. Categories already used by products must always remain selectable.
    known_slugs = {row[0] for row in db.query(ProductCategory.slug).all()}
    candidates = list(DEFAULT_PRODUCT_CATEGORIES)
    candidates.extend(
        (slug, slug.replace("-", " ").title())
        for (slug,) in db.query(CatalogProduct.category).distinct().all()
        if slug
    )
    for slug, name in candidates:
        if slug not in known_slugs:
            existing_name = db.query(ProductCategory).filter(ProductCategory.name.ilike(name)).first()
            db.add(ProductCategory(slug=slug, name=f"{name} category" if existing_name else name))
            known_slugs.add(slug)
    db.commit()
    return db.query(ProductCategory).order_by(ProductCategory.name.asc()).all()


def create_product_category_service(db: Session, payload: ProductCategoryCreate):
    name = " ".join(payload.name.split())
    slug = make_slug(name)
    duplicate = db.query(ProductCategory).filter(
        (ProductCategory.slug == slug) | (ProductCategory.name.ilike(name))
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This product category already exists")
    category = ProductCategory(name=name, slug=slug)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def delete_product_category_service(db: Session, category_id: int):
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Product category not found")
    product_count = db.query(CatalogProduct).filter(CatalogProduct.category == category.slug).count()
    if product_count:
        raise HTTPException(status_code=409, detail=f"Move or delete the {product_count} product(s) in this category first")
    db.delete(category)
    db.commit()


def ensure_product_category(db: Session, slug: str):
    if not db.query(ProductCategory).filter(ProductCategory.slug == slug).first():
        db.add(ProductCategory(slug=slug, name=slug.replace("-", " ").title()))


def normalize_catalog_payload(data: dict):
    if "slug" in data:
        data["slug"] = make_slug(data["slug"])
    if "sku" in data and data["sku"] is not None:
        data["sku"] = data["sku"].strip().upper()
    if "specs" in data and data["specs"] is not None:
        data["specs"] = [spec.strip() for spec in data["specs"] if spec.strip()]
    return data


def ensure_unique_catalog_identity(db: Session, slug: str, sku: str, product_id: Optional[int] = None):
    slug_match = get_catalog_product_by_slug(db, slug, published_only=False)
    sku_match = get_catalog_product_by_sku(db, sku)
    if slug_match and slug_match.id != product_id:
        raise HTTPException(status_code=400, detail="A product with this slug already exists")
    if sku_match and sku_match.id != product_id:
        raise HTTPException(status_code=400, detail="A product with this SKU already exists")


def remove_local_product_image(image_url: Optional[str]) -> None:
    if not image_url:
        return
    path = urlparse(image_url).path
    if not path.startswith("/uploads/"):
        return
    candidate = (UPLOAD_DIR / Path(path).name).resolve()
    if candidate.parent == UPLOAD_DIR.resolve() and candidate.exists():
        candidate.unlink()


def list_public_products_service(db: Session, *, category: str | None = None, search: str | None = None):
    return list_public_catalog_products(db, category=category, search=search)


def get_public_product_service(db: Session, slug: str):
    product = get_catalog_product_by_slug(db, slug, published_only=True)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def upload_product_image_service(request: Request, image: UploadFile = File(...)):
    image_rule = IMAGE_SIGNATURES.get(image.content_type or "")
    if not image_rule:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WebP image")

    contents = await image.read(MAX_IMAGE_SIZE + 1)
    await image.close()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Product image must be 5 MB or smaller")

    extension, signature_is_valid = image_rule
    if not contents or not signature_is_valid(contents):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image")

    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{filename}", "filename": filename}


def list_catalog_products_service(db: Session):
    return list_catalog_products(db)


def get_catalog_product_service(db: Session, product_id: int):
    product = get_catalog_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_catalog_product_service(db: Session, payload: CatalogProductCreate):
    data = payload.model_dump()
    data["slug"] = make_slug(payload.slug or payload.title)
    data["sku"] = payload.sku.strip().upper()
    data["specs"] = [spec.strip() for spec in payload.specs if spec.strip()]
    ensure_unique_catalog_identity(db, data["slug"], data["sku"])
    data["category"] = make_slug(data["category"])
    ensure_product_category(db, data["category"])

    product = CatalogProduct(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_catalog_product_service(db: Session, product_id: int, payload: CatalogProductUpdate):
    product = get_catalog_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)
    previous_image_url = product.image_url

    if "slug" in data:
        data["slug"] = make_slug(data["slug"] or data.get("title") or product.title)
    elif "title" in data and not product.slug:
        data["slug"] = make_slug(data["title"])

    data = normalize_catalog_payload(data)
    if data.get("category"):
        data["category"] = make_slug(data["category"])
        ensure_product_category(db, data["category"])
    ensure_unique_catalog_identity(db, data.get("slug", product.slug), data.get("sku", product.sku), product.id)

    for field, value in data.items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)

    if "image_url" in data and data["image_url"] != previous_image_url:
        remove_local_product_image(previous_image_url)
    return product


def delete_catalog_product_service(db: Session, product_id: int):
    product = get_catalog_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    image_url = product.image_url
    db.delete(product)
    db.commit()
    remove_local_product_image(image_url)
