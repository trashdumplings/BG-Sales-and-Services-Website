from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect, desc
from typing import List, Optional
from ..db import get_db, engine
from ..models import User, SuperAdmin, UserRole, AuditLog, SystemSetting, Employee
from ..utils.auth import get_password_hash, require_superadmin
from ..schemas import CombinedUserCreate, CombinedUserOut
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    skip: int = 0,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Get system audit logs. SuperAdmin only."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    return logs

@router.get("/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Get all system settings. SuperAdmin only."""
    return db.query(SystemSetting).all()

@router.patch("/settings/{key}")
def update_setting(
    key: str,
    value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Update a system setting. SuperAdmin only."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.value = value
    setting.updated_by_id = current_user.id
    db.commit()
    db.refresh(setting)
    return setting

@router.post("/seed", status_code=201)
def seed_users(db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    """Create default users and some initial settings/logs if empty."""
    try:
        # User seeding logic (keeping existing)
        defaults = [
            {"name": "Super Admin", "email": "superadmin@bg.com", "password": "superadmin123", "role": UserRole.superadmin},
            {"name": "Admin User", "email": "admin@bg.com", "password": "admin123", "role": UserRole.admin},
            {"name": "HR User", "email": "hr@bg.com", "password": "hr123", "role": UserRole.hr},
            {"name": "Employee User", "email": "employee@bg.com", "password": "emp123", "role": UserRole.employee},
        ]

        created = []
        for d in defaults:
            existing = db.query(User).filter(User.email == d["email"]).first()
            if not existing:
                user = User(
                    name=d["name"],
                    email=d["email"],
                    password_hash=get_password_hash(d["password"]),
                    role=d["role"],
                )
                db.add(user)
                created.append(d["email"])
        
        # Seed some default settings if empty
        if db.query(SystemSetting).count() == 0:
            settings_defaults = [
                {"key": "site_name", "value": "BG Services Portal", "category": "general", "description": "The name of the application"},
                {"key": "contact_email", "value": "support@bg.com", "category": "general", "description": "Primary support email"},
                {"key": "maintenance_mode", "value": "false", "category": "security", "description": "Enable maintenance mode"},
            ]
            for s in settings_defaults:
                setting = SystemSetting(**s)
                db.add(setting)
            created.append("default_settings")

        db.commit()
        return {"created": created, "message": "Seed complete"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Seed operation failed: {str(e)}")

@router.get("/users", response_model=List[CombinedUserOut])
def get_users_with_employees(db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    """Get all users with their associated employee information."""
    results = []
    users = db.query(User).all()
    for u in users:
        emp = db.query(Employee).filter(Employee.email == u.email).first()
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "employee_id": emp.employee_id if emp else None,
            "phone": emp.phone if emp else None,
            "department": emp.department if emp else None,
            "position": emp.position if emp else None
        })
    return results

@router.post("/users", status_code=201)
def create_combined_user(data: CombinedUserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    """Create a new user and corresponding employee record."""
    try:
        # 1. Create User
        user = User(
            name=data.name,
            email=data.email.lower(),
            password_hash=get_password_hash(data.password),
            role=data.role,
        )
        db.add(user)
        
        # 2. Create Employee
        emp = Employee(
            employee_id=data.employee_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email.lower(),
            phone=data.phone,
            department=data.department,
            position=data.position,
            salary=data.salary,
            hire_date=data.hire_date,
            status="active"
        )
        db.add(emp)
        
        db.commit()
        return {"message": "User created successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or Employee ID already exists")
