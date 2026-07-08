from typing import List, Optional

from fastapi import APIRouter, Depends, Request, Response, UploadFile, File
from sqlalchemy.orm import Session

from ...db import get_db
from ...models import ProductInteraction, User
from ...schemas import CatalogProductCreate, CatalogProductOut, CatalogProductUpdate, ProductInteractionCreate
from ...services.products import (
    create_catalog_product_service,
    delete_catalog_product_service,
    get_public_product_service,
    list_catalog_products_service,
    list_public_products_service,
    upload_product_image_service,
    update_catalog_product_service,
)
from ...utils.auth import require_admin_or_superadmin

router = APIRouter(prefix="/api/products", tags=["Website Products"])


@router.get("/public", response_model=List[CatalogProductOut])
def list_public_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return list_public_products_service(db, category=category, search=search)


@router.get("/public/{slug}", response_model=CatalogProductOut)
def get_public_product(slug: str, db: Session = Depends(get_db)):
    return get_public_product_service(db, slug)


@router.post("/public/{slug}/interaction", status_code=204)
def record_product_interaction(
    slug: str,
    payload: ProductInteractionCreate,
    db: Session = Depends(get_db),
):
    product = get_public_product_service(db, slug)
    db.add(ProductInteraction(product_id=product.id, event_type=payload.event_type))
    db.commit()
    return Response(status_code=204)


@router.post("/image")
async def upload_product_image(
    request: Request,
    image: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return await upload_product_image_service(request, image)


@router.get("", response_model=List[CatalogProductOut])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return list_catalog_products_service(db)


@router.post("", response_model=CatalogProductOut, status_code=201)
def create_product(
    payload: CatalogProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return create_catalog_product_service(db, payload)


@router.put("/{product_id}", response_model=CatalogProductOut)
def update_product(
    product_id: int,
    payload: CatalogProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return update_catalog_product_service(db, product_id, payload)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    delete_catalog_product_service(db, product_id)
    return Response(status_code=204)
