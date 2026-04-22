from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
import re
 
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.transporter import Transporter
from app.models.farmer import Farmer
from app.schemas.token import Token
from app.core.config import settings
 
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
 
 
# ── Transporter / Admin Login ──────────────────────────────────────────────────
 
@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 token login for transporters and admins.
    Role is read directly from the database so admins and
    transporters are distinguished correctly.
    """
    transporter = db.query(Transporter).filter(
        Transporter.username == form_data.username,
        Transporter.is_active == True
    ).first()
 
    if not transporter or not verify_password(form_data.password, transporter.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
 
    # Read role from DB — never hardcode
    role = transporter.role if transporter.role else "transporter"
 
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": transporter.username,
            "id": transporter.id,
            "role": role,
            "name": transporter.name,
        },
        expires_delta=access_token_expires
    )
 
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": transporter.name,
        "id": transporter.id,
        "role": role,
        "username": transporter.username,
    }
 
 
# ── Farmer Login ───────────────────────────────────────────────────────────────
 
@router.post("/farmer-login")
async def farmer_login(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    PIN login for farmers.
    Accepts phone in any Kenyan format:
      07XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX, 7XXXXXXXX
    Searches all format variations so real data from the
    cooperative works regardless of how phones were entered.
    """
    phone = request.get('phone', '').strip()
    pin = request.get('pin', '').strip()
 
    # Strip all non-digit characters
    clean = re.sub(r'\D', '', phone)
 
    # Build every possible stored format
    formats = set()
    formats.add(phone)          # exactly as typed
    formats.add(clean)          # digits only
 
    if clean.startswith('0') and len(clean) == 10:
        intl = '254' + clean[1:]
        formats.add(intl)
        formats.add('+' + intl)
    elif clean.startswith('254') and len(clean) == 12:
        formats.add('+' + clean)
        formats.add('0' + clean[3:])
    elif clean.startswith('7') and len(clean) == 9:
        intl = '254' + clean
        formats.add(intl)
        formats.add('+' + intl)
        formats.add('0' + clean)
 
    # Search all formats — stops at first match
    farmer = None
    for fmt in formats:
        farmer = db.query(Farmer).filter(
            Farmer.phone == fmt,
            Farmer.is_active == True
        ).first()
        if farmer:
            break
 
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phone number not registered. Please contact your cooperative administrator."
        )
 
    # Verify PIN
    if farmer.pin_hash:
        if not verify_password(pin, farmer.pin_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect PIN. Please try again."
            )
 
    # Create token with full farmer context
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": farmer.phone,
            "id": farmer.id,
            "role": "farmer",
            "farmer_id": farmer.farmer_id,
            "name": farmer.name,
            "phone": farmer.phone,
            "has_smartphone": farmer.has_smartphone,
        },
        expires_delta=access_token_expires
    )
 
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "farmer_id": farmer.farmer_id,
        "name": farmer.name,
        "phone": farmer.phone,
        "has_smartphone": farmer.has_smartphone,
        "id": farmer.id,
        "role": "farmer",
    }
 
 
# ── Change Farmer PIN ──────────────────────────────────────────────────────────
 
@router.post("/farmer/change-pin")
async def change_farmer_pin(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Allow a farmer to change their 4-digit PIN.
    Accepts phone in any format.
    """
    phone = request.get('phone', '').strip()
    old_pin = request.get('old_pin', '').strip()
    new_pin = request.get('new_pin', '').strip()
 
    if len(new_pin) != 4 or not new_pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New PIN must be exactly 4 digits"
        )
 
    clean = re.sub(r'\D', '', phone)
    formats = {phone, clean}
    if clean.startswith('0'):
        intl = '254' + clean[1:]
        formats.update([intl, '+' + intl])
    elif clean.startswith('254'):
        formats.update(['+' + clean, '0' + clean[3:]])
 
    farmer = None
    for fmt in formats:
        farmer = db.query(Farmer).filter(
            Farmer.phone == fmt,
            Farmer.is_active == True
        ).first()
        if farmer:
            break
 
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
 
    if not verify_password(old_pin, farmer.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current PIN is incorrect"
        )
 
    farmer.pin_hash = get_password_hash(new_pin)
    db.commit()
 
    return {"message": "PIN changed successfully"}