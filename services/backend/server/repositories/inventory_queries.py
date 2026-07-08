from sqlalchemy.orm import Session

from ..models import InventoryItem


def get_inventory_base_query(db: Session):
    return db.query(InventoryItem)


def get_inventory_item_by_id(db: Session, item_id: int):
    return db.get(InventoryItem, item_id)


def get_inventory_item_by_sku(db: Session, sku: str):
    return db.query(InventoryItem).filter(InventoryItem.sku == sku).first()


def list_inventory_items(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    status: str | None = None,
):
    query = get_inventory_base_query(db)
    if category:
        query = query.filter(InventoryItem.category == category)
    if status:
        query = query.filter(InventoryItem.status == status)
    return query.offset(skip).limit(limit).all()


def list_inventory_items_for_export(
    db: Session,
    *,
    category: str | None = None,
    status: str | None = None,
):
    query = get_inventory_base_query(db)
    if category:
        query = query.filter(InventoryItem.category == category)
    if status:
        query = query.filter(InventoryItem.status == status)
    return query.order_by(InventoryItem.category, InventoryItem.name).all()

