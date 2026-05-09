from datetime import date, datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import get_db
from ..models import User, Employee, Attendance, LeaveRequest, WorkLog, InventoryItem, UserRole
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile & Dashboard"])

@router.get("/me", response_model=Dict[str, Any])
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the current user's employee profile and dashboard stats."""
    print(f"DEBUG: Fetching profile for user: {current_user.email}")
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        print(f"DEBUG: Employee profile not found for: {current_user.email}")
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
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
    
    # 3. Recent Attendance (Last 7 days)
    last_week = today - timedelta(days=7)
    recent_attendance = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date >= last_week
    ).order_by(Attendance.date.desc()).all()
    
    # 4. Assigned Items (Inventory)
    # We might need a relationship in models, but for now we'll assume a 'assigned_to_id' field might be added
    # Or just check for things related to this employee
    # Since we don't have a direct 'assigned_to' in InventoryItem yet, let's skip for now or use a placeholder
    
    return {
        "employee": {
            "id": employee.id,
            "employee_id": employee.employee_id,
            "name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "department": employee.department,
            "position": employee.position,
            "status": employee.status,
            "hire_date": employee.hire_date
        },
        "stats": {
            "hours_this_month": monthly_hours,
            "leave_balance": leave_remaining,
            "attendance_rate": len(recent_attendance) / 7.0 if len(recent_attendance) > 0 else 0
        },
        "recent_attendance": [
            {"date": att.date, "check_in": att.check_in, "check_out": att.check_out, "status": att.status}
            for att in recent_attendance
        ]
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
