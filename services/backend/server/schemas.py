from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    module_permissions: List[str] = Field(default_factory=list)
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

class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        classes = (
            any(char.islower() for char in value),
            any(char.isupper() for char in value),
            any(char.isdigit() for char in value),
            any(not char.isalnum() for char in value),
        )
        if sum(classes) < 3:
            raise ValueError("Password must use at least three of: lowercase, uppercase, number, symbol")
        return value

class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=30)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

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

# Website product catalog schemas
class CatalogProductCreate(BaseModel):
    slug: Optional[str] = None
    sku: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=2, max_length=255)
    brand: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=100)
    image_url: Optional[str] = None
    previous_price: Optional[float] = Field(default=None, ge=0)
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    featured: bool = False
    is_published: bool = False
    short_description: str = Field(min_length=2, max_length=500)
    description: str = Field(min_length=2)
    specs: List[str] = Field(default_factory=list)

class CatalogProductUpdate(BaseModel):
    slug: Optional[str] = None
    sku: Optional[str] = Field(default=None, min_length=1, max_length=100)
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    image_url: Optional[str] = None
    previous_price: Optional[float] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    featured: Optional[bool] = None
    is_published: Optional[bool] = None
    short_description: Optional[str] = Field(default=None, min_length=2, max_length=500)
    description: Optional[str] = Field(default=None, min_length=2)
    specs: Optional[List[str]] = None

class CatalogProductOut(BaseModel):
    id: int
    slug: str
    sku: str
    title: str
    brand: str
    category: str
    image_url: Optional[str]
    previous_price: Optional[float]
    price: float
    stock: int
    featured: bool
    is_published: bool
    short_description: str
    description: str
    specs: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductInteractionCreate(BaseModel):
    event_type: str = Field(pattern="^(view|quote_add|quote_submit)$")

# Work Log schemas
class WorkLogCreate(BaseModel):
    project_id: Optional[int] = None
    date: date
    task_name: str
    hours: float
    description: Optional[str] = None
    challenges_faced: Optional[str] = None
    status: str = "completed"

class WorkLogUpdate(BaseModel):
    date: Optional[date] = None
    project_id: Optional[int] = None
    task_name: Optional[str] = None
    hours: Optional[float] = None
    description: Optional[str] = None
    challenges_faced: Optional[str] = None
    status: Optional[str] = None

class WorkLogReviewAction(BaseModel):
    reviewer_comment: Optional[str] = None

class WorkLogOut(BaseModel):
    id: int
    employee_id: int
    project_id: Optional[int]
    date: date
    task_name: str
    hours: float
    description: Optional[str]
    challenges_faced: Optional[str]
    status: str
    workflow_status: str
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    reviewed_by_id: Optional[int]
    reviewer_comment: Optional[str]
    is_approved: bool
    approved_by_id: Optional[int]
    manager_comment: Optional[str]
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
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
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: str
    position: str
    salary: Optional[float] = None
    hire_date: datetime

    @field_validator("role")
    @classmethod
    def validate_supported_role(cls, value: UserRole) -> UserRole:
        if value not in {UserRole.superadmin, UserRole.hr, UserRole.employee}:
            raise ValueError("Role must be one of: superadmin, hr, employee")
        return value

    @field_validator("phone")
    @classmethod
    def validate_bhutan_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(char for char in value if char.isdigit())
        if digits.startswith("975"):
            digits = digits[3:]
        if len(digits) != 8 or not digits.startswith(("17", "77")):
            raise ValueError("Enter a valid Bhutan mobile number starting with 17 or 77")
        return f"+975{digits}"

class CombinedUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    module_permissions: List[str] = Field(default_factory=list)
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None

    class Config:
        from_attributes = True

class ModulePermissionsUpdate(BaseModel):
    permissions: List[str] = Field(default_factory=list)

    @field_validator("permissions")
    @classmethod
    def validate_permissions(cls, values: List[str]) -> List[str]:
        allowed = {"products", "inventory", "reports", "employees"}
        invalid = set(values) - allowed
        if invalid:
            raise ValueError(f"Unsupported module permissions: {', '.join(sorted(invalid))}")
        return sorted(set(values))
