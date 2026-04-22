from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.models.transporter import Transporter
from app.schemas.transporter import Transporter as TransporterSchema, TransporterCreate
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=TransporterSchema, status_code=status.HTTP_201_CREATED)
async def register_transporter(
    transporter: TransporterCreate,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new transporter"""
    
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
        is_active=True
    )
    
    db.add(db_transporter)
    db.commit()
    db.refresh(db_transporter)
    
    return db_transporter

@router.get("/{username}", response_model=TransporterSchema)
async def get_transporter(
    username: str,
    db: Session = Depends(get_db)
) -> Any:
    """Get transporter by username"""
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
    db: Session = Depends(get_db)
) -> Any:
    """List all transporters"""
    transporters = db.query(Transporter).offset(skip).limit(limit).all()
    return transporters

@router.put("/{username}/deactivate")
async def deactivate_transporter(
    username: str,
    db: Session = Depends(get_db)
) -> Any:
    """Deactivate a transporter account"""
    transporter = db.query(Transporter).filter(Transporter.username == username).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    
    transporter.is_active = False
    db.commit()
    
    return {"message": f"Transporter {username} deactivated successfully"}