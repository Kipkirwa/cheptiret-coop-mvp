from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_transporter
from app.models.farmer import Farmer
from app.schemas.farmer import Farmer as FarmerSchema, FarmerCreate
from app.core.security import get_password_hash

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    has_smartphone: Optional[bool] = None
    is_active: Optional[bool] = None


class PinReset(BaseModel):
    new_pin: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def normalize_phone(phone: str) -> str:
    """Normalize any Kenyan phone format to +254XXXXXXXXX"""
    phone = phone.strip()
    if phone.startswith('+'):
        return phone
    if phone.startswith('0'):
        return '+254' + phone[1:]
    if phone.startswith('254'):
        return '+' + phone
    return phone


# ── Endpoints with Role-Based Access ─────────────────────────────────────────

@router.get("/", response_model=List[FarmerSchema])
async def list_farmers(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(require_transporter),  # ✅ Admin & Transporter can view
    db: Session = Depends(get_db)
) -> Any:
    """List all farmers - Admin & Transporter only"""
    farmers = db.query(Farmer).offset(skip).limit(limit).all()
    return farmers


@router.get("/{farmer_id}", response_model=FarmerSchema)
async def get_farmer(
    farmer_id: str,
    current_user = Depends(get_current_user),  # ✅ All authenticated users
    db: Session = Depends(get_db)
) -> Any:
    """Get farmer by ID - Farmers can only see their own profile"""
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    # Farmers can only see their own data
    if current_user['role'] == 'farmer' and current_user.get('farmer_id') != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )
    
    return farmer


@router.post("/register", response_model=FarmerSchema, status_code=status.HTTP_201_CREATED)
async def register_farmer(
    farmer: FarmerCreate,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """Register a new farmer - Admin only"""
    phone = normalize_phone(farmer.phone)

    if db.query(Farmer).filter(Farmer.farmer_id == farmer.farmer_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farmer ID already registered"
        )

    if db.query(Farmer).filter(Farmer.phone == phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    db_farmer = Farmer(
        farmer_id=farmer.farmer_id,
        name=farmer.name,
        phone=phone,
        has_smartphone=farmer.has_smartphone,
        pin_hash=get_password_hash(farmer.pin),
        is_active=True,
    )

    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)

    return db_farmer


@router.post("/", response_model=FarmerSchema, status_code=status.HTTP_201_CREATED)
async def create_farmer(
    farmer: FarmerCreate,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new farmer — same as /register but at root path
    Admin only
    """
    phone = normalize_phone(farmer.phone)

    if db.query(Farmer).filter(Farmer.farmer_id == farmer.farmer_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farmer ID already registered"
        )

    if db.query(Farmer).filter(Farmer.phone == phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    db_farmer = Farmer(
        farmer_id=farmer.farmer_id,
        name=farmer.name,
        phone=phone,
        has_smartphone=farmer.has_smartphone,
        pin_hash=get_password_hash(farmer.pin),
        is_active=True,
    )

    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)

    return db_farmer


@router.put("/{farmer_id}", response_model=FarmerSchema)
async def update_farmer(
    farmer_id: str,
    update: FarmerUpdate,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """Update farmer details — Admin only"""
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )

    if update.name is not None:
        farmer.name = update.name

    if update.phone is not None:
        new_phone = normalize_phone(update.phone)
        existing = db.query(Farmer).filter(
            Farmer.phone == new_phone,
            Farmer.farmer_id != farmer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered to another farmer"
            )
        farmer.phone = new_phone

    if update.has_smartphone is not None:
        farmer.has_smartphone = update.has_smartphone

    if update.is_active is not None:
        farmer.is_active = update.is_active

    db.commit()
    db.refresh(farmer)

    return farmer


@router.post("/{farmer_id}/reset-pin")
async def reset_farmer_pin(
    farmer_id: str,
    request: PinReset,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """Admin resets a farmer's PIN - Admin only"""
    if not request.new_pin or len(request.new_pin) != 4 or not request.new_pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be exactly 4 digits"
        )

    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )

    farmer.pin_hash = get_password_hash(request.new_pin)
    db.commit()

    return {
        "success": True,
        "message": f"PIN reset successfully for {farmer.name}",
        "farmer_id": farmer_id,
    }


@router.put("/{farmer_id}/deactivate")
async def deactivate_farmer(
    farmer_id: str,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """Deactivate a farmer account - Admin only"""
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )

    farmer.is_active = False
    db.commit()

    return {"message": f"Farmer {farmer_id} deactivated successfully"}


# ── Farmer self-service endpoints ─────────────────────────────────────────────

@router.get("/profile/me")
async def get_my_profile(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current farmer's own profile - Farmer only"""
    if current_user['role'] != 'farmer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for farmers"
        )
    
    farmer = db.query(Farmer).filter(Farmer.id == current_user['id']).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    return {
        "id": farmer.id,
        "farmer_id": farmer.farmer_id,
        "name": farmer.name,
        "phone": farmer.phone,
        "has_smartphone": farmer.has_smartphone,
        "is_active": farmer.is_active,
        "created_at": farmer.created_at
    }


@router.put("/profile/me/pin")
async def change_my_pin(
    request: PinReset,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Farmer changes their own PIN - Farmer only"""
    if current_user['role'] != 'farmer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for farmers"
        )
    
    if not request.new_pin or len(request.new_pin) != 4 or not request.new_pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be exactly 4 digits"
        )
    
    farmer = db.query(Farmer).filter(Farmer.id == current_user['id']).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    farmer.pin_hash = get_password_hash(request.new_pin)
    db.commit()
    
    return {"message": "PIN changed successfully"}
