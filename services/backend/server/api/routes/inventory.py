from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from sqlalchemy.orm import Session

from ...db import get_db
from ...models import User
from ...schemas import InventoryAdjust, InventoryItemCreate, InventoryItemOut, InventoryItemUpdate
from ...services.inventory import (
    adjust_inventory_quantity_service,
    create_inventory_item_service,
    delete_inventory_item_service,
    export_inventory_csv_service,
    get_inventory_item_by_sku_service,
    get_inventory_item_service,
    list_inventory_items_service,
    update_inventory_item_service,
)
from ...utils.auth import get_current_user, require_admin_or_superadmin

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.post("", response_model=InventoryItemOut, status_code=201)
def create_inventory_item(
    item: InventoryItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return create_inventory_item_service(db, item, background_tasks)


@router.get("", response_model=List[InventoryItemOut])
def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_inventory_items_service(db, skip=skip, limit=limit, category=category, status=status)


@router.get("/report", include_in_schema=False)
@router.get("/report.csv")
def export_inventory_csv(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return export_inventory_csv_service(db, category=category, status=status)


@router.get("/{item_id}", response_model=InventoryItemOut)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_inventory_item_service(db, item_id)


@router.get("/sku/{sku}", response_model=InventoryItemOut)
def get_inventory_item_by_sku(
    sku: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_inventory_item_by_sku_service(db, sku)


@router.put("/{item_id}", response_model=InventoryItemOut)
def update_inventory_item(
    item_id: int,
    item_update: InventoryItemUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return update_inventory_item_service(db, item_id=item_id, item_update=item_update, background_tasks=background_tasks)


@router.delete("/{item_id}", status_code=204)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    delete_inventory_item_service(db, item_id)
    return Response(status_code=204)


@router.patch("/{item_id}/adjust", response_model=InventoryItemOut)
def adjust_inventory_quantity(
    item_id: int,
    adjustment: InventoryAdjust,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    return adjust_inventory_quantity_service(db, item_id=item_id, adjustment=adjustment, background_tasks=background_tasks)

