from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...db import get_db
from ...models import BusinessDocument, CatalogProduct, Employee, LeaveRequest, User, UserRole, WorkLog
from ...services.reports import get_inventory_alerts_data, get_monthly_summary_data
from ...utils.auth import get_current_user, has_module_permission

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    responses={404: {"description": "Not found"}},
)


def verify_admin_or_hr(user: User):
    if not has_module_permission(user, "reports"):
        raise HTTPException(status_code=403, detail="Not enough permissions to view reports")
    return user


@router.get("/monthly-summary")
def get_monthly_summary(
    year: int = Query(default_factory=lambda: datetime.now().year, ge=2000, le=2100),
    month: int = Query(default_factory=lambda: datetime.now().month, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_admin_or_hr(current_user)
    return get_monthly_summary_data(db=db, year=year, month=month)


@router.get("/inventory-alerts")
def get_inventory_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_admin_or_hr(current_user)
    return get_inventory_alerts_data(db=db)

@router.get("/extract/{category}")
def extract_report(
    category: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_admin_or_hr(current_user)
    start = start_date.date() if start_date else None
    end = end_date.date() if end_date else None
    if category == "work_logs":
        query = db.query(WorkLog, Employee).join(Employee, Employee.id == WorkLog.employee_id)
        if start: query = query.filter(WorkLog.date >= start)
        if end: query = query.filter(WorkLog.date <= end)
        rows = [{"date": str(w.date), "employee": f"{e.first_name} {e.last_name}", "task": w.task_name, "hours": float(w.hours), "task_status": w.status, "approval_status": w.workflow_status} for w, e in query.order_by(WorkLog.date.desc()).all()]
    elif category == "leave":
        query = db.query(LeaveRequest, Employee).join(Employee, Employee.id == LeaveRequest.employee_id)
        if start: query = query.filter(LeaveRequest.end_date >= start)
        if end: query = query.filter(LeaveRequest.start_date <= end)
        rows = [{"employee": f"{e.first_name} {e.last_name}", "leave_type": l.leave_type, "start_date": str(l.start_date), "end_date": str(l.end_date), "days": l.total_days, "status": l.status, "reason": l.reason or ""} for l, e in query.order_by(LeaveRequest.start_date.desc()).all()]
    elif category == "products":
        query = db.query(CatalogProduct)
        if start: query = query.filter(func.date(CatalogProduct.created_at) >= start)
        if end: query = query.filter(func.date(CatalogProduct.created_at) <= end)
        rows = [{"sku": p.sku, "product": p.title, "brand": p.brand, "category": p.category, "price": float(p.price), "stock": p.stock, "published": p.is_published} for p in query.order_by(CatalogProduct.title).all()]
    elif category == "documents":
        query = db.query(BusinessDocument)
        if start: query = query.filter(BusinessDocument.issue_date >= start)
        if end: query = query.filter(BusinessDocument.issue_date <= end)
        rows = [{"number": d.document_number, "date": str(d.issue_date), "company": d.company, "type": d.document_type, "party": d.party_name, "currency": d.currency, "subtotal": float(d.subtotal), "tax": float(d.tax_amount), "total": float(d.grand_total), "status": d.status} for d in query.order_by(BusinessDocument.issue_date.desc()).all()]
    else:
        raise HTTPException(status_code=404, detail="Unknown report category")
    return {"category": category, "count": len(rows), "rows": rows}
