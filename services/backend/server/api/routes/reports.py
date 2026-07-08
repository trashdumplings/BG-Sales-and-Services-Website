from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db import get_db
from ...models import User, UserRole
from ...services.reports import get_inventory_alerts_data, get_monthly_summary_data
from ...utils.auth import get_current_user

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    responses={404: {"description": "Not found"}},
)


def verify_admin_or_hr(user: User):
    if user.role not in [UserRole.superadmin, UserRole.admin, UserRole.hr]:
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

