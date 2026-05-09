import csv
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, InventoryItem
from ..schemas import InventoryItemOut, InventoryItemCreate, InventoryItemUpdate, InventoryAdjust
from ..utils.auth import get_current_user, require_admin_or_superadmin
from ..utils.email import schedule_email
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.post("", response_model=InventoryItemOut, status_code=201)
def create_inventory_item(
    item: InventoryItemCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Create a new inventory item. Admin and SuperAdmin only."""
    # Check if SKU already exists
    existing = db.query(InventoryItem).filter(InventoryItem.sku == item.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    # Auto-update status based on quantity
    status = item.status
    if item.quantity <= 0:
        status = "out_of_stock"
    elif item.quantity < item.reorder_level:
        status = "low_stock"
    
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
        reorder_level=item.reorder_level,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Notify when created already in low or out-of-stock
    if db_item.status in ("low_stock", "out_of_stock"):
        subject = f"[Inventory Alert] {db_item.name} is {db_item.status.replace('_', ' ')}"
        body = (
            f"Item: {db_item.name} (SKU: {db_item.sku})\n"
            f"Status: {db_item.status}\n"
            f"Quantity: {db_item.quantity}\n"
            f"Reorder level: {db_item.reorder_level}\n"
        )
        schedule_email(background_tasks, subject, body, settings.INVENTORY_ALERT_EMAIL)
    return db_item

@router.get("", response_model=List[InventoryItemOut])
def get_inventory_items(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get all inventory items with optional filtering. All authenticated users can view."""
    query = db.query(InventoryItem)
    if category:
        query = query.filter(InventoryItem.category == category)
    if status:
        query = query.filter(InventoryItem.status == status)
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/report", include_in_schema=False)
@router.get("/report.csv")
def export_inventory_csv(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export inventory items as CSV for reporting."""
    query = db.query(InventoryItem)
    if category:
        query = query.filter(InventoryItem.category == category)
    if status:
        query = query.filter(InventoryItem.status == status)
    items = query.order_by(InventoryItem.category, InventoryItem.name).all()

    output = BytesIO()
    writer = csv.writer(output.decode('utf-8') if hasattr(output, 'decode') else output) # Handling BytesIO for csv writer
    # Actually, csv.writer needs a text stream.
    import io
    text_output = io.StringIO()
    writer = csv.writer(text_output)
    
    writer.writerow(
        [
            "ID", "SKU", "Name", "Category", "Quantity", "Status", 
            "Reorder Level", "Unit Price", "Location", "Created At", "Updated At"
        ]
    )
    for item in items:
        writer.writerow(
            [
                item.id, item.sku, item.name, item.category, item.quantity, item.status,
                item.reorder_level, float(item.unit_price), item.location or "",
                item.created_at.isoformat(), item.updated_at.isoformat()
            ]
        )
    text_output.seek(0)
    headers = {
        "Content-Disposition": 'attachment; filename="inventory-report.csv"'
    }
    return StreamingResponse(io.BytesIO(text_output.getvalue().encode('utf-8')), media_type="text/csv", headers=headers)

@router.get("/{item_id}", response_model=InventoryItemOut)
def get_inventory_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific inventory item by ID."""
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.get("/sku/{sku}", response_model=InventoryItemOut)
def get_inventory_item_by_sku(sku: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get an inventory item by SKU."""
    item = db.query(InventoryItem).filter(InventoryItem.sku == sku).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.put("/{item_id}", response_model=InventoryItemOut)
def update_inventory_item(
    item_id: int, 
    item_update: InventoryItemUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Update an inventory item. Admin and SuperAdmin only."""
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    update_data = item_update.model_dump(exclude_unset=True)
    previous_status = item.status
    
    # Auto-update status based on quantity if quantity is being updated
    if "quantity" in update_data:
        quantity = update_data["quantity"]
        if quantity <= 0:
            update_data["status"] = "out_of_stock"
        elif quantity < (update_data.get("reorder_level", item.reorder_level)):
            update_data["status"] = "low_stock"
        elif "status" not in update_data:
            update_data["status"] = "available"
            
    # Versioning: increment version if name, description, or unit_price changes
    if any(field in update_data for field in ["name", "description", "unit_price"]):
        item.version += 1
    
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    # Notify if status transitioned to low/out of stock
    if item.status in ("low_stock", "out_of_stock") and item.status != previous_status:
        subject = f"[Inventory Alert] {item.name} is now {item.status.replace('_', ' ')}"
        body = (
            f"Item: {item.name} (SKU: {item.sku})\n"
            f"Status: {item.status}\n"
            f"Quantity: {item.quantity}\n"
            f"Reorder level: {item.reorder_level}\n"
        )
        schedule_email(background_tasks, subject, body, settings.INVENTORY_ALERT_EMAIL)
    return item

@router.delete("/{item_id}", status_code=204)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_superadmin)):
    """Delete an inventory item. Admin and SuperAdmin only."""
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    db.delete(item)
    db.commit()
    return Response(status_code=204)

@router.patch("/{item_id}/adjust", response_model=InventoryItemOut)
def adjust_inventory_quantity(
    item_id: int,
    adjustment: InventoryAdjust,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Adjust inventory quantity (add or subtract). Admin and SuperAdmin only."""
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    new_quantity = item.quantity + adjustment.quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Cannot reduce quantity below 0")
    previous_status = item.status
    
    item.quantity = new_quantity
    
    # Auto-update status
    if new_quantity <= 0:
        item.status = "out_of_stock"
    elif new_quantity < item.reorder_level:
        item.status = "low_stock"
    else:
        item.status = "available"
    
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    if item.status in ("low_stock", "out_of_stock") and item.status != previous_status:
        subject = f"[Inventory Alert] {item.name} is now {item.status.replace('_', ' ')}"
        body = (
            f"Item: {item.name} (SKU: {item.sku})\n"
            f"Status: {item.status}\n"
            f"Quantity: {item.quantity}\n"
            f"Reorder level: {item.reorder_level}\n"
        )
        schedule_email(background_tasks, subject, body, settings.INVENTORY_ALERT_EMAIL)
    return item
