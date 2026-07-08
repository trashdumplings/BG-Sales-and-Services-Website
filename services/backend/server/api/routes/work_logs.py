from typing import List, Optional

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ...db import get_db
from ...models import User
from ...schemas import WorkLogCreate, WorkLogOut, WorkLogReviewAction, WorkLogUpdate
from ...services.work_logs import (
    approve_work_log_service,
    create_work_log_service,
    delete_work_log_service,
    get_work_log_service,
    list_review_queue_service,
    list_work_logs_service,
    reject_work_log_service,
    resubmit_work_log_service,
    submit_work_log_service,
    update_work_log_service,
)
from ...utils.auth import get_current_user, require_hr_or_admin

router = APIRouter(prefix="/api/work-logs", tags=["Work Logs"])


@router.get("", response_model=List[WorkLogOut])
def get_work_logs(
    skip: int = 0,
    limit: int = 100,
    workflow_status: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_work_logs_service(
        db,
        current_user,
        skip=skip,
        limit=limit,
        workflow_status=workflow_status,
        employee_id=employee_id,
    )


@router.get("/review-queue", response_model=List[WorkLogOut])
def get_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin),
):
    return list_review_queue_service(db, current_user)


@router.get("/{log_id}", response_model=WorkLogOut)
def get_work_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_work_log_service(db, log_id, current_user)


@router.post("", response_model=WorkLogOut, status_code=201)
def create_work_log(
    payload: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_work_log_service(db, payload, current_user)


@router.patch("/{log_id}", response_model=WorkLogOut)
def update_work_log(
    log_id: int,
    payload: WorkLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_work_log_service(db, log_id, payload, current_user)


@router.post("/{log_id}/submit", response_model=WorkLogOut)
def submit_work_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return submit_work_log_service(db, log_id, current_user)


@router.post("/{log_id}/resubmit", response_model=WorkLogOut)
def resubmit_work_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return resubmit_work_log_service(db, log_id, current_user)


@router.post("/{log_id}/approve", response_model=WorkLogOut)
def approve_work_log(
    log_id: int,
    payload: WorkLogReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin),
):
    return approve_work_log_service(db, log_id, payload, current_user)


@router.post("/{log_id}/reject", response_model=WorkLogOut)
def reject_work_log(
    log_id: int,
    payload: WorkLogReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin),
):
    return reject_work_log_service(db, log_id, payload, current_user)


@router.delete("/{log_id}", status_code=204)
def delete_work_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_work_log_service(db, log_id, current_user)
    return Response(status_code=204)
