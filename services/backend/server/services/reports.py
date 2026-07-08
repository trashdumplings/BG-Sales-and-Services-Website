import calendar
from datetime import date

from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from ..models import CatalogProduct, Employee, InventoryItem, LeaveRequest, ProductInteraction, WorkLog


def get_monthly_summary_data(db: Session, year: int, month: int):
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    employees = db.query(Employee).filter(Employee.status == "active").all()

    work_logs = (
        db.query(
            WorkLog.employee_id,
            func.sum(WorkLog.hours).label("total_hours"),
            func.count(WorkLog.id).label("tasks_completed"),
        )
        .filter(
            WorkLog.date >= start_date,
            WorkLog.date <= end_date,
            WorkLog.workflow_status == "approved",
        )
        .group_by(WorkLog.employee_id)
        .all()
    )

    work_log_map = {
        item.employee_id: {
            "total_hours": float(item.total_hours or 0),
            "tasks_completed": item.tasks_completed,
        }
        for item in work_logs
    }

    leave_requests = (
        db.query(
            LeaveRequest.employee_id,
            func.sum(LeaveRequest.total_days).label("leaves_taken"),
        )
        .filter(
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        .group_by(LeaveRequest.employee_id)
        .all()
    )

    leave_map = {item.employee_id: int(item.leaves_taken or 0) for item in leave_requests}

    global_total_hours = sum(entry["total_hours"] for entry in work_log_map.values())
    global_total_leaves = sum(leave_map.values())

    popular_products = (
        db.query(
            CatalogProduct.id,
            CatalogProduct.title,
            CatalogProduct.category,
            func.count(ProductInteraction.id).label("interactions"),
            func.sum(func.cast(ProductInteraction.event_type == "quote_add", Integer)).label("quote_adds"),
        )
        .join(ProductInteraction, ProductInteraction.product_id == CatalogProduct.id)
        .filter(ProductInteraction.created_at >= start_date, ProductInteraction.created_at <= end_date)
        .group_by(CatalogProduct.id, CatalogProduct.title, CatalogProduct.category)
        .order_by(func.count(ProductInteraction.id).desc())
        .limit(10)
        .all()
    )

    employee_reports = []
    for employee in employees:
        employee_work = work_log_map.get(employee.id, {"total_hours": 0.0, "tasks_completed": 0})
        employee_leaves = leave_map.get(employee.id, 0)

        employee_reports.append(
            {
                "employee_id": employee.id,
                "employee_code": employee.employee_id,
                "name": f"{employee.first_name} {employee.last_name}",
                "department": employee.department,
                "position": employee.position,
                "total_hours": employee_work["total_hours"],
                "tasks_completed": employee_work["tasks_completed"],
                "leaves_taken": employee_leaves,
            }
        )

    return {
        "period": {
            "year": year,
            "month": month,
            "start_date": start_date,
            "end_date": end_date,
        },
        "kpis": {
            "total_employees": len(employees),
            "total_hours_logged": global_total_hours,
            "total_leaves_taken": global_total_leaves,
        },
        "employee_summary": employee_reports,
        "popular_products": [
            {
                "product_id": item.id,
                "title": item.title,
                "category": item.category,
                "interactions": item.interactions,
                "quote_adds": int(item.quote_adds or 0),
            }
            for item in popular_products
        ],
    }


def get_inventory_alerts_data(db: Session):
    low_stock_items = (
        db.query(
            InventoryItem.id,
            InventoryItem.sku,
            InventoryItem.name,
            InventoryItem.category,
            InventoryItem.quantity,
            InventoryItem.reorder_level,
        )
        .filter(InventoryItem.quantity <= InventoryItem.reorder_level)
        .all()
    )

    return [
        {
            "id": item.id,
            "sku": item.sku,
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "reorder_level": item.reorder_level,
            "status": "out_of_stock" if item.quantity == 0 else "low_stock",
        }
        for item in low_stock_items
    ]
