from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Employee, UserRole
from ..schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut
from ..utils.auth import get_current_user, require_admin_or_superadmin, require_hr_or_admin, require_module_permission

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_hr_or_admin)):
    """Create a new employee. Admin, SuperAdmin and HR only."""
    # Check if employee_id or email already exists
    existing = db.query(Employee).filter(
        (Employee.employee_id == employee.employee_id) | (Employee.email == employee.email.lower())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID or email already exists")
    
    db_employee = Employee(
        employee_id=employee.employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email.lower(),
        phone=employee.phone,
        department=employee.department,
        position=employee.position,
        salary=employee.salary,
        hire_date=employee.hire_date,
        status=employee.status,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("", response_model=List[EmployeeOut])
def get_employees(
    skip: int = 0, 
    limit: int = 100, 
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_module_permission("employees"))
):
    """Get all employees with optional filtering. All authenticated users can view."""
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department == department)
    if status:
        query = query.filter(Employee.status == status)
    employees = query.offset(skip).limit(limit).all()
    return employees

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_module_permission("employees"))):
    """Get a specific employee by ID."""
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, 
    employee_update: EmployeeUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_hr_or_admin)
):
    """Update an employee. Admin, SuperAdmin and HR only."""
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_update.model_dump(exclude_unset=True)
    if "email" in update_data:
        # Check if email is already taken by another employee
        existing = db.query(Employee).filter(
            Employee.email == update_data["email"].lower(),
            Employee.id != employee_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = update_data["email"].lower()
    
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    employee.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_superadmin)):
    """Delete an employee. Admin and SuperAdmin only."""
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    return Response(status_code=204)
