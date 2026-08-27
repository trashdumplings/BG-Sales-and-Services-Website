from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import get_db
from ..models import User, Employee, Attendance, LeaveRequest, WorkLog
from ..schemas import ProfileUpdate
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile & Dashboard"])

@router.get("/me", response_model=Dict[str, Any])
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the current user's employee profile and dashboard stats."""
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        return {
            "account": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role,
                "is_active": current_user.is_active,
                "created_at": current_user.created_at,
                "last_login": current_user.last_login,
            },
            "employee": None,
            "stats": {
                "hours_this_month": 0,
                "leave_balance": 0,
                "attendance_rate": 0,
            },
            "recent_attendance": [],
        }
    
    # 1. Total Work Hours (This month)
    today = date.today()
    first_day_of_month = today.replace(day=1)
    monthly_hours = db.query(func.sum(WorkLog.hours)).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.date >= first_day_of_month,
        WorkLog.date <= today
    ).scalar() or 0.0
    
    # 2. Leave Balance
    annual_leave_entitlement = 24
    used_leave = db.query(func.sum(LeaveRequest.total_days)).filter(
        LeaveRequest.employee_id == employee.id,
        LeaveRequest.status == "approved",
        LeaveRequest.leave_type == "annual"
    ).scalar() or 0
    leave_remaining = max(0, annual_leave_entitlement - used_leave)
    
    # 3. Attendance rate (last 7 days) and latest stored attendance records.
    last_week = today - timedelta(days=7)
    attendance_last_week = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date >= last_week
    ).all()
    recent_attendance = db.query(Attendance).filter(
        Attendance.employee_id == employee.id
    ).order_by(Attendance.date.desc()).limit(7).all()
    
    # 4. Assigned Items (Inventory)
    # We might need a relationship in models, but for now we'll assume a 'assigned_to_id' field might be added
    # Or just check for things related to this employee
    # Since we don't have a direct 'assigned_to' in InventoryItem yet, let's skip for now or use a placeholder
    
    return {
        "account": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at,
            "last_login": current_user.last_login,
        },
        "employee": {
            "id": employee.id,
            "employee_id": employee.employee_id,
            "name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "phone": employee.phone,
            "department": employee.department,
            "position": employee.position,
            "status": employee.status,
            "hire_date": employee.hire_date
        },
        "stats": {
            "hours_this_month": monthly_hours,
            "leave_balance": leave_remaining,
            "attendance_rate": len(attendance_last_week) / 7.0 if attendance_last_week else 0
        },
        "recent_attendance": [
            {"date": att.date, "check_in": att.check_in, "check_out": att.check_out, "status": att.status}
            for att in recent_attendance
        ]
    }

@router.patch("/me", response_model=Dict[str, Any])
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's safe, self-service profile fields."""
    current_user.name = payload.name
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()

    if employee:
        name_parts = payload.name.split(" ", 1)
        employee.first_name = name_parts[0]
        employee.last_name = name_parts[1] if len(name_parts) > 1 else ""
        employee.phone = payload.phone

    db.commit()
    db.refresh(current_user)
    return {
        "name": current_user.name,
        "email": current_user.email,
        "phone": employee.phone if employee else None,
        "employee_linked": employee is not None,
    }

@router.post("/attendance/check-in", status_code=201)
def check_in(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Mark attendance check-in for today."""
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    today = date.today()
    existing = db.query(Attendance).filter(Attendance.employee_id == employee.id, Attendance.date == today).first()
    
    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail="Already checked in for today")
        
    if not existing:
        attendance = Attendance(
            employee_id=employee.id,
            date=today,
            check_in=datetime.now(timezone.utc),
            status="present"
        )
        db.add(attendance)
    else:
        existing.check_in = datetime.now(timezone.utc)
        existing.status = "present"
        
    db.commit()
    return {"message": "Checked in successfully"}

@router.post("/attendance/check-out")
def check_out(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Mark attendance check-out for today."""
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    today = date.today()
    attendance = db.query(Attendance).filter(Attendance.employee_id == employee.id, Attendance.date == today).first()
    
    if not attendance or not attendance.check_in:
        raise HTTPException(status_code=400, detail="Must check in before checking out")
        
    if attendance.check_out:
        raise HTTPException(status_code=400, detail="Already checked out for today")
        
    attendance.check_out = datetime.now(timezone.utc)
    
    # Calculate hours
    delta = attendance.check_out - attendance.check_in
    attendance.total_hours = delta.total_seconds() / 3600.0
    
    db.commit()
    return {"message": "Checked out successfully", "hours": attendance.total_hours}
