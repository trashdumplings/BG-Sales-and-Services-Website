from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Employee, User, UserRole, WorkLog
from ..schemas import WorkLogCreate, WorkLogReviewAction, WorkLogUpdate
from ..utils.logging import log_activity

WORKFLOW_DRAFT = "draft"
WORKFLOW_SUBMITTED = "submitted"
WORKFLOW_APPROVED = "approved"
WORKFLOW_REJECTED = "rejected"
WORKFLOW_STATUSES = {
    WORKFLOW_DRAFT,
    WORKFLOW_SUBMITTED,
    WORKFLOW_APPROVED,
    WORKFLOW_REJECTED,
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def attach_employee_metadata(db: Session, work_log: WorkLog) -> WorkLog:
    employee = db.get(Employee, work_log.employee_id)
    setattr(
        work_log,
        "employee_name",
        f"{employee.first_name} {employee.last_name}".strip() if employee else None,
    )
    setattr(work_log, "employee_code", employee.employee_id if employee else None)
    return work_log


def attach_employee_metadata_many(db: Session, work_logs: list[WorkLog]) -> list[WorkLog]:
    if not work_logs:
        return work_logs
    employee_ids = {log.employee_id for log in work_logs}
    employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    employee_map = {employee.id: employee for employee in employees}
    for work_log in work_logs:
        employee = employee_map.get(work_log.employee_id)
        setattr(
            work_log,
            "employee_name",
            f"{employee.first_name} {employee.last_name}".strip() if employee else None,
        )
        setattr(work_log, "employee_code", employee.employee_id if employee else None)
    return work_logs


def get_employee_for_user(db: Session, current_user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.email == current_user.email.lower()).first()
    if not employee:
        raise HTTPException(status_code=400, detail="User is not associated with an employee record")
    return employee


def is_management_user(current_user: User) -> bool:
    return current_user.role in [UserRole.superadmin, UserRole.hr]


def get_work_log_or_404(db: Session, log_id: int) -> WorkLog:
    work_log = db.get(WorkLog, log_id)
    if not work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    return work_log


def ensure_work_log_access(db: Session, work_log: WorkLog, current_user: User) -> None:
    if is_management_user(current_user):
        return
    employee = get_employee_for_user(db, current_user)
    if work_log.employee_id != employee.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this work log")


def list_work_logs_service(
    db: Session,
    current_user: User,
    *,
    skip: int = 0,
    limit: int = 100,
    workflow_status: Optional[str] = None,
    employee_id: Optional[int] = None,
):
    query = db.query(WorkLog)

    if is_management_user(current_user):
        if employee_id is not None:
            query = query.filter(WorkLog.employee_id == employee_id)
    else:
        employee = get_employee_for_user(db, current_user)
        query = query.filter(WorkLog.employee_id == employee.id)

    if workflow_status:
        if workflow_status not in WORKFLOW_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid workflow status")
        query = query.filter(WorkLog.workflow_status == workflow_status)

    work_logs = (
        query.order_by(WorkLog.date.desc(), WorkLog.created_at.desc()).offset(skip).limit(limit).all()
    )
    return attach_employee_metadata_many(db, work_logs)


def list_review_queue_service(db: Session, current_user: User):
    if not is_management_user(current_user):
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can review work logs")
    work_logs = (
        db.query(WorkLog)
        .filter(WorkLog.workflow_status == WORKFLOW_SUBMITTED)
        .order_by(WorkLog.submitted_at.desc().nullslast(), WorkLog.date.desc())
        .all()
    )
    return attach_employee_metadata_many(db, work_logs)


def get_work_log_service(db: Session, log_id: int, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    ensure_work_log_access(db, work_log, current_user)
    return attach_employee_metadata(db, work_log)


def create_work_log_service(db: Session, payload: WorkLogCreate, current_user: User):
    employee = get_employee_for_user(db, current_user)
    work_log = WorkLog(
        employee_id=employee.id,
        project_id=payload.project_id,
        date=payload.date,
        task_name=payload.task_name,
        hours=payload.hours,
        description=payload.description,
        challenges_faced=payload.challenges_faced,
        status=payload.status or "completed",
        workflow_status=WORKFLOW_DRAFT,
        is_approved=False,
        approved_by_id=None,
        manager_comment=None,
        reviewed_by_id=None,
        reviewer_comment=None,
        submitted_at=None,
        reviewed_at=None,
    )
    db.add(work_log)
    db.commit()
    db.refresh(work_log)

    log_activity(
        db,
        current_user.id,
        "create",
        "work_log",
        work_log.id,
        f"Created draft work log for {work_log.date}: {work_log.task_name}",
    )
    return attach_employee_metadata(db, work_log)


def update_work_log_service(db: Session, log_id: int, payload: WorkLogUpdate, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    ensure_work_log_access(db, work_log, current_user)

    if work_log.workflow_status not in {WORKFLOW_DRAFT, WORKFLOW_REJECTED}:
        raise HTTPException(status_code=400, detail="Only draft or rejected work logs can be edited")

    if is_management_user(current_user):
        raise HTTPException(status_code=403, detail="HR and SuperAdmin cannot edit employee work log contents")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(work_log, field, value)

    db.commit()
    db.refresh(work_log)
    log_activity(
        db,
        current_user.id,
        "update",
        "work_log",
        work_log.id,
        f"Updated work log for {work_log.date}: {work_log.task_name}",
    )
    return attach_employee_metadata(db, work_log)


def submit_work_log_service(db: Session, log_id: int, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    ensure_work_log_access(db, work_log, current_user)
    if work_log.workflow_status != WORKFLOW_DRAFT:
        raise HTTPException(status_code=400, detail="Only draft work logs can be submitted")

    work_log.workflow_status = WORKFLOW_SUBMITTED
    work_log.submitted_at = utc_now()
    db.commit()
    db.refresh(work_log)
    log_activity(
        db,
        current_user.id,
        "submit",
        "work_log",
        work_log.id,
        f"Submitted work log for review: {work_log.task_name}",
    )
    return attach_employee_metadata(db, work_log)


def resubmit_work_log_service(db: Session, log_id: int, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    ensure_work_log_access(db, work_log, current_user)
    if work_log.workflow_status != WORKFLOW_REJECTED:
        raise HTTPException(status_code=400, detail="Only rejected work logs can be resubmitted")

    work_log.workflow_status = WORKFLOW_SUBMITTED
    work_log.submitted_at = utc_now()
    work_log.is_approved = False
    db.commit()
    db.refresh(work_log)
    log_activity(
        db,
        current_user.id,
        "resubmit",
        "work_log",
        work_log.id,
        f"Resubmitted rejected work log: {work_log.task_name}",
    )
    return attach_employee_metadata(db, work_log)


def approve_work_log_service(db: Session, log_id: int, payload: WorkLogReviewAction, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    if not is_management_user(current_user):
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can review work logs")
    if work_log.workflow_status != WORKFLOW_SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted work logs can be approved")

    work_log.workflow_status = WORKFLOW_APPROVED
    work_log.reviewed_at = utc_now()
    work_log.reviewed_by_id = current_user.id
    work_log.reviewer_comment = payload.reviewer_comment
    work_log.is_approved = True
    work_log.approved_by_id = current_user.id
    work_log.manager_comment = payload.reviewer_comment
    db.commit()
    db.refresh(work_log)
    log_activity(
        db,
        current_user.id,
        "approve",
        "work_log",
        work_log.id,
        f"Approved work log for employee ID {work_log.employee_id} on {work_log.date}",
    )
    return attach_employee_metadata(db, work_log)


def reject_work_log_service(db: Session, log_id: int, payload: WorkLogReviewAction, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    if not is_management_user(current_user):
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can review work logs")
    if work_log.workflow_status != WORKFLOW_SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted work logs can be rejected")

    work_log.workflow_status = WORKFLOW_REJECTED
    work_log.reviewed_at = utc_now()
    work_log.reviewed_by_id = current_user.id
    work_log.reviewer_comment = payload.reviewer_comment
    work_log.is_approved = False
    work_log.approved_by_id = current_user.id
    work_log.manager_comment = payload.reviewer_comment
    db.commit()
    db.refresh(work_log)
    log_activity(
        db,
        current_user.id,
        "reject",
        "work_log",
        work_log.id,
        f"Rejected work log for employee ID {work_log.employee_id} on {work_log.date}",
    )
    return attach_employee_metadata(db, work_log)


def delete_work_log_service(db: Session, log_id: int, current_user: User):
    work_log = get_work_log_or_404(db, log_id)
    ensure_work_log_access(db, work_log, current_user)

    if not is_management_user(current_user) and work_log.workflow_status != WORKFLOW_DRAFT:
        raise HTTPException(status_code=400, detail="Only draft work logs can be deleted")

    db.delete(work_log)
    db.commit()
    log_activity(
        db,
        current_user.id,
        "delete",
        "work_log",
        log_id,
        f"Deleted work log dated {work_log.date}",
    )
