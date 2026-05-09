from datetime import date, datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Employee, WorkLog, UserRole
from ..schemas import WorkLogCreate, WorkLogUpdate, WorkLogOut
from ..utils.auth import get_current_user, require_hr_or_admin

router = APIRouter(prefix="/api/work-logs", tags=["Work Logs"])

@router.post("", response_model=WorkLogOut, status_code=201)
def create_work_log(work_log: WorkLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new work log for the current employee user."""
    # Find employee associated with this user
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        raise HTTPException(status_code=400, detail="User is not associated with an employee record")
    
    db_work_log = WorkLog(
        employee_id=employee.id,
        project_id=work_log.project_id,
        date=work_log.date,
        task_name=work_log.task_name,
        hours=work_log.hours,
        description=work_log.description,
        status=work_log.status
    )
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    
    from ..utils.logging import log_activity
    log_activity(
        db, 
        current_user.id, 
        "create", 
        "work_log", 
        db_work_log.id, 
        f"Created work log for {db_work_log.date}: {db_work_log.task_name}"
    )
    
    return db_work_log

@router.get("", response_model=List[WorkLogOut])
def get_work_logs(
    skip: int = 0, 
    limit: int = 100, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get work logs with filtering. Employees see their own; Admins/HR see all."""
    query = db.query(WorkLog)
    
    # If not admin/hr, restrict to own logs
    if current_user.role not in [UserRole.admin, UserRole.superadmin, UserRole.hr]:
        employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
        if not employee:
            return []
        query = query.filter(WorkLog.employee_id == employee.id)
    elif employee_id:
        query = query.filter(WorkLog.employee_id == employee_id)

    if start_date:
        query = query.filter(WorkLog.date >= start_date)
    if end_date:
        query = query.filter(WorkLog.date <= end_date)
        
    logs = query.offset(skip).limit(limit).all()
    return logs

@router.patch("/{log_id}/approve", response_model=WorkLogOut)
def approve_work_log(
    log_id: int, 
    approval_data: WorkLogUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_hr_or_admin)
):
    """Approve or reject a work log. Admin/HR only."""
    work_log = db.get(WorkLog, log_id)
    if not work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    
    if approval_data.is_approved is not None:
        work_log.is_approved = approval_data.is_approved
        work_log.approved_by_id = current_user.id
        
    if approval_data.manager_comment is not None:
        work_log.manager_comment = approval_data.manager_comment
        
    db.commit()
    db.refresh(work_log)
    
    from ..utils.logging import log_activity
    status_str = "Approved" if work_log.is_approved else "Rejected"
    log_activity(
        db, 
        current_user.id, 
        "approve" if work_log.is_approved else "reject", 
        "work_log", 
        work_log.id, 
        f"{status_str} work log for employee ID {work_log.employee_id} on {work_log.date}"
    )
    
    return work_log

@router.delete("/{log_id}", status_code=204)
def delete_work_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a work log. Only owners can delete before approval."""
    work_log = db.get(WorkLog, log_id)
    if not work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    
    # Check ownership or admin
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if (not employee or work_log.employee_id != employee.id) and current_user.role not in [UserRole.admin, UserRole.superadmin]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this log")
        
    if work_log.is_approved and current_user.role not in [UserRole.admin, UserRole.superadmin]:
        raise HTTPException(status_code=400, detail="Cannot delete an approved work log")
        
    db.delete(work_log)
    db.commit()
    return Response(status_code=204)
