from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Employee, LeaveRequest, UserRole
from ..schemas import LeaveRequestCreate, LeaveRequestOut, LeaveBalanceOut
from ..utils.auth import get_current_user
from ..utils.email import schedule_email
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

ANNUAL_LEAVE_ENTITLEMENT = 24

def _get_employee_for_user(db: Session, current_user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        raise HTTPException(status_code=400, detail="No employee record linked to this user")
    return employee

@router.post("", response_model=LeaveRequestOut, status_code=201)
def create_leave_request(
    payload: LeaveRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Employee creates a leave request."""
    employee = _get_employee_for_user(db, current_user)
    total_days = (payload.end_date - payload.start_date).days + 1
    if total_days <= 0:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    # Overlap validation
    overlapping = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee.id,
        LeaveRequest.status != "rejected",
        LeaveRequest.start_date <= payload.end_date,
        LeaveRequest.end_date >= payload.start_date
    ).first()
    
    if overlapping:
        raise HTTPException(status_code=400, detail=f"Leave request overlaps with an existing request ({overlapping.start_date} to {overlapping.end_date})")

    leave = LeaveRequest(
        employee_id=employee.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_days=total_days,
        reason=payload.reason,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    from ..utils.logging import log_activity
    log_activity(
        db, 
        current_user.id, 
        "create", 
        "leave_request", 
        leave.id, 
        f"Requested {leave.leave_type} leave from {leave.start_date} to {leave.end_date}"
    )

    # Notify approvers
    subject = f"[Leave Request] {employee.first_name} {employee.last_name} requested {total_days} day(s)"
    body = (
        f"Employee: {employee.first_name} {employee.last_name} ({employee.email})\n"
        f"Type: {leave.leave_type}\n"
        f"From: {leave.start_date} To: {leave.end_date}\n"
        f"Reason: {leave.reason or '-'}\n"
        f"Status: {leave.status}\n"
    )
    schedule_email(background_tasks, subject, body, settings.INVENTORY_ALERT_EMAIL)
    return leave

@router.get("", response_model=List[LeaveRequestOut])
def list_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List leave requests. Employees see their own; SuperAdmin/HR see all."""
    query = db.query(LeaveRequest)
    if current_user.role not in [UserRole.superadmin, UserRole.hr]:
        employee = _get_employee_for_user(db, current_user)
        query = query.filter(LeaveRequest.employee_id == employee.id)
    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    return leaves

@router.post("/{leave_id}/approve", response_model=LeaveRequestOut)
def approve_leave(
    leave_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a leave request and notify the employee via email."""
    if current_user.role not in [UserRole.superadmin, UserRole.hr]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can approve leaves")

    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    leave.status = "approved"
    leave.approved_by_id = current_user.id
    leave.approved_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(leave)

    employee = db.get(Employee, leave.employee_id)
    if employee and employee.email:
        subject = "[Leave Request Approved]"
        body = (
            f"Hi {employee.first_name},\n\n"
            f"Your leave request ({leave.leave_type}) from {leave.start_date} to {leave.end_date} "
            f"for {leave.total_days} day(s) has been approved.\n\n"
            f"Regards,\nBG Services HR"
        )
        schedule_email(background_tasks, subject, body, employee.email)
    return leave

@router.post("/{leave_id}/reject", response_model=LeaveRequestOut)
def reject_leave(
    leave_id: int,
    reason: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a leave request and notify the employee via email."""
    if current_user.role not in [UserRole.superadmin, UserRole.hr]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can reject leaves")

    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    leave.status = "rejected"
    leave.approved_by_id = current_user.id
    leave.approved_at = datetime.now(timezone.utc)
    leave.rejection_reason = reason
    leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(leave)

    employee = db.get(Employee, leave.employee_id)
    if employee and employee.email:
        subject = "[Leave Request Rejected]"
        body = (
            f"Hi {employee.first_name},\n\n"
            f"Your leave request ({leave.leave_type}) from {leave.start_date} to {leave.end_date} "
            f"for {leave.total_days} day(s) has been rejected.\n\n"
            f"Reason: {reason}\n\n"
            f"Regards,\nBG Services HR"
        )
        schedule_email(background_tasks, subject, body, employee.email)
    return leave

@router.get("/balance", response_model=LeaveBalanceOut)
def get_leave_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Simple annual leave balance calculation for the current employee."""
    employee = _get_employee_for_user(db, current_user)
    approved_leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status == "approved",
            LeaveRequest.leave_type == "annual",
        )
        .all()
    )
    used = sum(l.total_days for l in approved_leaves)
    remaining = max(0, ANNUAL_LEAVE_ENTITLEMENT - used)
    return LeaveBalanceOut(
        annual_entitlement=ANNUAL_LEAVE_ENTITLEMENT,
        annual_used=used,
        annual_remaining=remaining,
    )
