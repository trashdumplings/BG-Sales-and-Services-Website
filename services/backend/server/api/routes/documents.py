from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from ...db import get_db
from ...models import BusinessDocument, User
from ...utils.auth import get_current_user, has_module_permission

router = APIRouter(prefix="/api/documents", tags=["Documents"])
TYPES = {"bill": "BILL", "supply_order": "SO", "proforma_invoice": "PI", "purchase_order": "PO"}

class DocumentIn(BaseModel):
    company: str
    document_type: str
    issue_date: date = Field(default_factory=date.today)
    party_name: str = Field(min_length=1, max_length=255)
    party_details: dict = Field(default_factory=dict)
    reference: str | None = None
    currency: str = "BTN"
    items: list[dict] = Field(min_length=1)
    tax_rate: Decimal = Field(default=Decimal("5"), ge=0, le=100)
    terms: str | None = None
    notes: str | None = None

def allowed(user: User):
    if not has_module_permission(user, "documents"):
        raise HTTPException(403, "Documents permission required")

def serialize(d):
    return {c.name: getattr(d, c.name) for c in d.__table__.columns}

@router.get("")
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed(user)
    return [serialize(x) for x in db.query(BusinessDocument).order_by(BusinessDocument.created_at.desc()).all()]

@router.post("", status_code=201)
def create_document(data: DocumentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed(user)
    company, kind = data.company.upper(), data.document_type
    if company not in {"BGSS", "BGCS"} or kind not in TYPES:
        raise HTTPException(422, "Unsupported company or document type")
    subtotal = sum(Decimal(str(i.get("quantity", 0))) * Decimal(str(i.get("unit_rate", 0))) for i in data.items)
    tax = (subtotal * data.tax_rate / 100).quantize(Decimal("0.01"))
    prefix = f"{company}/{TYPES[kind]}-{data.issue_date.year}/"
    count = db.query(func.count(BusinessDocument.id)).filter(BusinessDocument.document_number.like(f"{prefix}%")).scalar()
    doc = BusinessDocument(**data.model_dump(), company=company, document_number=f"{prefix}{count + 1:03d}", subtotal=subtotal, tax_amount=tax, grand_total=subtotal + tax, created_by_id=user.id)
    db.add(doc); db.commit(); db.refresh(doc)
    return serialize(doc)
