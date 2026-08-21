import pytest
from fastapi import BackgroundTasks, HTTPException

from server.services import inventory as inventory_service
from server.services.inventory import (
    derive_inventory_status,
    maybe_schedule_inventory_alert,
    create_inventory_item_service,
    update_inventory_item_service,
    adjust_inventory_quantity_service,
    delete_inventory_item_service,
)
from server.schemas import InventoryItemCreate, InventoryItemUpdate, InventoryAdjust


@pytest.fixture(autouse=True)
def _smtp_configured(monkeypatch):
    # schedule_email() no-ops unless SMTP is configured; tests here only care whether the
    # service layer *asks* to schedule an alert, not the real email transport.
    monkeypatch.setattr(inventory_service.settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(inventory_service.settings, "SMTP_PORT", 587)
    monkeypatch.setattr(inventory_service.settings, "EMAIL_FROM", "alerts@example.com")


def make_item_payload(**overrides):
    data = dict(sku="INV-001", name="Test Widget", category="Accessories", quantity=20, unit_price=9.99, reorder_level=10)
    data.update(overrides)
    return InventoryItemCreate(**data)


class TestDeriveInventoryStatus:
    @pytest.mark.parametrize(
        "quantity,reorder_level,expected",
        [
            (0, 10, "out_of_stock"),
            (-1, 10, "out_of_stock"),
            (5, 10, "low_stock"),
            (9, 10, "low_stock"),
            (10, 10, "available"),
            (100, 10, "available"),
        ],
    )
    def test_status_boundaries(self, quantity, reorder_level, expected):
        assert derive_inventory_status(quantity, reorder_level) == expected


class TestMaybeScheduleInventoryAlert:
    def test_no_alert_when_available(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=50, reorder_level=10), BackgroundTasks())
        bg = BackgroundTasks()
        maybe_schedule_inventory_alert(bg, item)
        assert len(bg.tasks) == 0

    def test_alert_when_low_stock_and_no_previous_status(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(sku="INV-LOW", quantity=2, reorder_level=10), BackgroundTasks())
        bg = BackgroundTasks()
        maybe_schedule_inventory_alert(bg, item)
        assert len(bg.tasks) == 1

    def test_no_duplicate_alert_when_status_unchanged(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(sku="INV-LOW2", quantity=2, reorder_level=10), BackgroundTasks())
        bg = BackgroundTasks()
        maybe_schedule_inventory_alert(bg, item, previous_status="low_stock")
        assert len(bg.tasks) == 0

    def test_alert_when_status_changed_from_available(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(sku="INV-LOW3", quantity=2, reorder_level=10), BackgroundTasks())
        bg = BackgroundTasks()
        maybe_schedule_inventory_alert(bg, item, previous_status="available")
        assert len(bg.tasks) == 1


class TestCreateInventoryItemService:
    def test_computes_status_on_create(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=0, reorder_level=5), BackgroundTasks())
        assert item.status == "out_of_stock"

    def test_duplicate_sku_rejected(self, db_session):
        create_inventory_item_service(db_session, make_item_payload(sku="DUP-SKU"), BackgroundTasks())
        with pytest.raises(HTTPException) as exc:
            create_inventory_item_service(db_session, make_item_payload(sku="DUP-SKU"), BackgroundTasks())
        assert exc.value.status_code == 400


class TestUpdateInventoryItemService:
    def test_recomputes_status_when_quantity_changes(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=50, reorder_level=10), BackgroundTasks())
        updated = update_inventory_item_service(
            db_session, item_id=item.id, item_update=InventoryItemUpdate(quantity=0), background_tasks=BackgroundTasks()
        )
        assert updated.status == "out_of_stock"

    def test_does_not_recompute_status_when_unrelated_field_changes(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=50, reorder_level=10), BackgroundTasks())
        updated = update_inventory_item_service(
            db_session, item_id=item.id, item_update=InventoryItemUpdate(location="Warehouse B"), background_tasks=BackgroundTasks()
        )
        assert updated.status == "available"
        assert updated.location == "Warehouse B"

    def test_version_bumps_on_core_field_change(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(), BackgroundTasks())
        assert item.version == 1
        updated = update_inventory_item_service(
            db_session, item_id=item.id, item_update=InventoryItemUpdate(name="Renamed Widget"), background_tasks=BackgroundTasks()
        )
        assert updated.version == 2

    def test_version_unchanged_for_non_core_field(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(), BackgroundTasks())
        updated = update_inventory_item_service(
            db_session, item_id=item.id, item_update=InventoryItemUpdate(location="Shelf 4"), background_tasks=BackgroundTasks()
        )
        assert updated.version == 1

    def test_missing_item_raises_404(self, db_session):
        with pytest.raises(HTTPException) as exc:
            update_inventory_item_service(
                db_session, item_id=999999, item_update=InventoryItemUpdate(name="x"), background_tasks=BackgroundTasks()
            )
        assert exc.value.status_code == 404


class TestAdjustInventoryQuantityService:
    def test_positive_adjustment_increases_quantity(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=10), BackgroundTasks())
        updated = adjust_inventory_quantity_service(
            db_session, item_id=item.id, adjustment=InventoryAdjust(quantity_change=5), background_tasks=BackgroundTasks()
        )
        assert updated.quantity == 15

    def test_negative_adjustment_below_zero_rejected(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=3), BackgroundTasks())
        with pytest.raises(HTTPException) as exc:
            adjust_inventory_quantity_service(
                db_session, item_id=item.id, adjustment=InventoryAdjust(quantity_change=-10), background_tasks=BackgroundTasks()
            )
        assert exc.value.status_code == 400

    def test_adjustment_to_exactly_zero_allowed(self, db_session):
        item = create_inventory_item_service(db_session, make_item_payload(quantity=5, reorder_level=10), BackgroundTasks())
        updated = adjust_inventory_quantity_service(
            db_session, item_id=item.id, adjustment=InventoryAdjust(quantity_change=-5), background_tasks=BackgroundTasks()
        )
        assert updated.quantity == 0
        assert updated.status == "out_of_stock"


class TestDeleteInventoryItemService:
    def test_missing_item_raises_404(self, db_session):
        with pytest.raises(HTTPException) as exc:
            delete_inventory_item_service(db_session, 999999)
        assert exc.value.status_code == 404
