"""
Authentication dependencies for role-based access control
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.core.config import settings
from app.models.transporter import Transporter
from app.models.farmer import Farmer

# Use HTTPBearer instead of OAuth2PasswordBearer for better header handling
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get current user from Bearer token
    Returns user info with role
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("id")
        role = payload.get("role")
        username = payload.get("sub")
        name = payload.get("name")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user id"
            )
            
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    
    # For admin/transporter, verify in transporters table
    if role in ["admin", "transporter"]:
        user = db.query(Transporter).filter(
            Transporter.id == user_id,
            Transporter.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
            
        return {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "type": "transporter"
        }
    
    # For farmer role
    elif role == "farmer":
        user = db.query(Farmer).filter(
            Farmer.id == user_id,
            Farmer.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Farmer not found or inactive"
            )
            
        return {
            "id": user.id,
            "farmer_id": user.farmer_id,
            "name": user.name,
            "phone": user.phone,
            "role": "farmer",
            "type": "farmer"
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid role: {role}"
        )


def require_admin(current_user: Dict = Depends(get_current_user)):
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_transporter(current_user: Dict = Depends(get_current_user)):
    """Require transporter or admin role"""
    role = current_user.get("role")
    if role not in ["transporter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transporter or admin access required"
        )
    return current_user


def require_farmer(current_user: Dict = Depends(get_current_user)):
    """Require farmer role"""
    if current_user.get("role") != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer access required"
        )
    return current_user
