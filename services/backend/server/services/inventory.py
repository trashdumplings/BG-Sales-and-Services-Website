import csv
import io
from datetime import datetime, timezone

from fastapi import BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import InventoryItem
from ..repositories.inventory_queries import (
    get_inventory_item_by_id,
    get_inventory_item_by_sku,
    list_inventory_items,
    list_inventory_items_for_export,
)
from ..schemas import InventoryAdjust, InventoryItemCreate, InventoryItemUpdate
from ..utils.email import schedule_email

settings = get_settings()


def derive_inventory_status(quantity: int, reorder_level: int):
    if quantity <= 0:
        return "out_of_stock"
    if quantity < reorder_level:
        return "low_stock"
    return "available"


def maybe_schedule_inventory_alert(background_tasks: BackgroundTasks, item: InventoryItem, previous_status: str | None = None):
    if item.status not in ("low_stock", "out_of_stock"):
        return
    if previous_status is not None and item.status == previous_status:
        return

    subject = f"[Inventory Alert] {item.name} is {item.status.replace('_', ' ')}"
    body = (
        f"Item: {item.name} (SKU: {item.sku})\n"
        f"Status: {item.status}\n"
        f"Quantity: {item.quantity}\n"
        f"Reorder level: {item.reorder_level}\n"
    )
    schedule_email(background_tasks, subject, body, settings.INVENTORY_ALERT_EMAIL)


def create_inventory_item_service(db: Session, item: InventoryItemCreate, background_tasks: BackgroundTasks):
    existing = get_inventory_item_by_sku(db, item.sku)
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    status = derive_inventory_status(item.quantity, item.reorder_level)

    db_item = InventoryItem(
        sku=item.sku,
        name=item.name,
        description=item.description,
        category=item.category,
        quantity=item.quantity,
        unit_price=item.unit_price,
        supplier=item.supplier,
        location=item.location,
        status=status,
        cms_status=item.cms_status,
        reorder_level=item.reorder_level,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    maybe_schedule_inventory_alert(background_tasks, db_item)
    return db_item


def list_inventory_items_service(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    status: str | None = None,
):
    return list_inventory_items(db, skip=skip, limit=limit, category=category, status=status)


def export_inventory_csv_service(db: Session, *, category: str | None = None, status: str | None = None):
    items = list_inventory_items_for_export(db, category=category, status=status)

    text_output = io.StringIO()
    writer = csv.writer(text_output)
    writer.writerow(
        [
            "ID", "SKU", "Name", "Category", "Quantity", "Status",
            "Reorder Level", "Unit Price", "Location", "Created At", "Updated At",
        ]
    )
    for item in items:
        writer.writerow(
            [
                item.id,
                item.sku,
                item.name,
                item.category,
                item.quantity,
                item.status,
                item.reorder_level,
                float(item.unit_price),
                item.location or "",
                item.created_at.isoformat(),
                item.updated_at.isoformat(),
            ]
        )

    text_output.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="inventory-report.csv"'}
    return StreamingResponse(io.BytesIO(text_output.getvalue().encode("utf-8")), media_type="text/csv", headers=headers)


def get_inventory_item_service(db: Session, item_id: int):
    item = get_inventory_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def get_inventory_item_by_sku_service(db: Session, sku: str):
    item = get_inventory_item_by_sku(db, sku)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def update_inventory_item_service(
    db: Session,
    *,
    item_id: int,
    item_update: InventoryItemUpdate,
    background_tasks: BackgroundTasks,
):
    item = get_inventory_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = item_update.model_dump(exclude_unset=True)
    previous_status = item.status

    next_quantity = update_data.get("quantity", item.quantity)
    next_reorder_level = update_data.get("reorder_level", item.reorder_level)
    if "quantity" in update_data or "reorder_level" in update_data:
        update_data["status"] = derive_inventory_status(next_quantity, next_reorder_level)

    if any(field in update_data for field in ["name", "description", "unit_price"]):
        item.version += 1

    for field, value in update_data.items():
        setattr(item, field, value)

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    maybe_schedule_inventory_alert(background_tasks, item, previous_status)
    return item


def delete_inventory_item_service(db: Session, item_id: int):
    item = get_inventory_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()


def adjust_inventory_quantity_service(
    db: Session,
    *,
    item_id: int,
    adjustment: InventoryAdjust,
    background_tasks: BackgroundTasks,
):
    item = get_inventory_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    new_quantity = item.quantity + adjustment.quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Cannot reduce quantity below 0")

    previous_status = item.status
    item.quantity = new_quantity
    item.status = derive_inventory_status(new_quantity, item.reorder_level)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    maybe_schedule_inventory_alert(background_tasks, item, previous_status)
    return item

