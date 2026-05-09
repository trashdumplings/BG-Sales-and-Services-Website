from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from .models import UserRole

# Auth schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ChallengeOut(BaseModel):
    challenge_id: str
    question: str
    expires_in_seconds: int

class SessionOut(BaseModel):
    id: str
    user_id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    revoked_at: Optional[datetime]
    revoked_reason: Optional[str]

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee

# Employee schemas
class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    position: str
    salary: Optional[float] = None
    hire_date: datetime
    status: str = "active"

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[str] = None

class EmployeeOut(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    department: str
    position: str
    salary: Optional[float]
    hire_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Inventory schemas
class InventoryItemCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    quantity: int = 0
    unit_price: float
    supplier: Optional[str] = None
    location: Optional[str] = None
    status: str = "available"
    cms_status: str = "draft"
    reorder_level: int = 10

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    cms_status: Optional[str] = None
    reorder_level: Optional[int] = None

class InventoryItemOut(BaseModel):
    id: int
    sku: str
    name: str
    description: Optional[str]
    category: str
    quantity: int
    unit_price: float
    supplier: Optional[str]
    location: Optional[str]
    status: str
    cms_status: str
    version: int
    reorder_level: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InventoryAdjust(BaseModel):
    quantity_change: int  # Positive to add, negative to subtract

# Work Log schemas
class WorkLogCreate(BaseModel):
    project_id: Optional[int] = None
    date: date
    task_name: str
    hours: float
    description: Optional[str] = None
    status: str = "in_progress"

class WorkLogUpdate(BaseModel):
    task_name: Optional[str] = None
    hours: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_approved: Optional[bool] = None
    manager_comment: Optional[str] = None

class WorkLogOut(BaseModel):
    id: int
    employee_id: int
    project_id: Optional[int]
    date: date
    task_name: str
    hours: float
    description: Optional[str]
    status: str
    is_approved: bool
    approved_by_id: Optional[int]
    manager_comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Leave schemas
class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    total_days: int
    status: str
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceOut(BaseModel):
    annual_entitlement: int
    annual_used: int
    annual_remaining: int

# Combined User/Employee schemas
class CombinedUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    employee_id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: str
    position: str
    salary: Optional[float] = None
    hire_date: datetime

class CombinedUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None

    class Config:
        from_attributes = True
