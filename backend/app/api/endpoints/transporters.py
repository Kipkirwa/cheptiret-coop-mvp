from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.transporter import Transporter
from app.schemas.transporter import Transporter as TransporterSchema, TransporterCreate
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=TransporterSchema, status_code=status.HTTP_201_CREATED)
async def register_transporter(
    transporter: TransporterCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Register a new transporter - Admin only"""
    
    # Format phone number
    phone = transporter.phone
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif phone.startswith('+'):
        phone = phone[1:]
    
    # Check if username exists
    db_transporter = db.query(Transporter).filter(Transporter.username == transporter.username).first()
    if db_transporter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if phone exists
    db_transporter = db.query(Transporter).filter(Transporter.phone == phone).first()
    if db_transporter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create transporter
    hashed_password = get_password_hash(transporter.password)
    db_transporter = Transporter(
        name=transporter.name,
        phone=phone,
        username=transporter.username,
        password_hash=hashed_password,
        is_active=True,
        role="transporter"
    )
    
    db.add(db_transporter)
    db.commit()
    db.refresh(db_transporter)
    
    return db_transporter


@router.get("/{username}", response_model=TransporterSchema)
async def get_transporter(
    username: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Get transporter by username - Admin only"""
    transporter = db.query(Transporter).filter(Transporter.username == username).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    return transporter


@router.get("/", response_model=List[TransporterSchema])
async def list_transporters(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """List all transporters - Admin only"""
    transporters = db.query(Transporter).offset(skip).limit(limit).all()
    return transporters


@router.put("/{transporter_id}", response_model=TransporterSchema)
async def update_transporter(
    transporter_id: int,
    transporter_update: dict,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update a transporter - Admin only"""
    transporter = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    
    # Don't allow changing the main admin account
    if transporter.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify the main admin account"
        )
    
    # Update fields
    if "name" in transporter_update:
        transporter.name = transporter_update["name"]
    if "phone" in transporter_update:
        phone = transporter_update["phone"]
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]
        transporter.phone = phone
    if "is_active" in transporter_update:
        transporter.is_active = transporter_update["is_active"]
    if "role" in transporter_update and transporter.username != "admin":
        transporter.role = transporter_update["role"]
    
    db.commit()
    db.refresh(transporter)
    
    return transporter


@router.put("/{username}/deactivate")
async def deactivate_transporter(
    username: str,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Deactivate a transporter account - Admin only"""
    transporter = db.query(Transporter).filter(Transporter.username == username).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    
    transporter.is_active = False
    db.commit()
    
    return {"message": f"Transporter {username} deactivated successfully"}


@router.delete("/{transporter_id}")
async def delete_transporter(
    transporter_id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a transporter - Admin only"""
    transporter = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    
    # Prevent deleting the main admin account
    if transporter.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete the main admin account"
        )
    
    db.delete(transporter)
    db.commit()
    
    return {"message": f"Transporter {transporter.username} deleted successfully"}