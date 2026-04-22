from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
 
 
class FarmerBase(BaseModel):
    farmer_id: str
    name: str
    phone: str
    has_smartphone: bool = False
 
 
class FarmerCreate(FarmerBase):
    pin: str
 
    @validator('pin')
    def validate_pin(cls, v):
        if len(v) != 4 or not v.isdigit():
            raise ValueError('PIN must be exactly 4 digits')
        return v
 
    @validator('phone')
    def validate_phone(cls, v):
        v = v.strip()
        if v.startswith('0') and len(v) == 10:
            return '+254' + v[1:]
        elif v.startswith('+254') and len(v) == 13:
            return v  # already correct format
        elif v.startswith('254') and len(v) == 12:
            return '+' + v
        elif v.startswith('7') and len(v) == 9:
            return '+254' + v
        raise ValueError('Phone must be a valid Kenyan number (e.g. 0712345678 or +254712345678)')
 
 
class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    has_smartphone: Optional[bool] = None
    is_active: Optional[bool] = None
 
    @validator('phone', pre=True, always=False)
    def validate_phone_update(cls, v):
        if v is None:
            return v
        v = v.strip()
        if v.startswith('0') and len(v) == 10:
            return '+254' + v[1:]
        elif v.startswith('+254') and len(v) == 13:
            return v
        elif v.startswith('254') and len(v) == 12:
            return '+' + v
        elif v.startswith('7') and len(v) == 9:
            return '+254' + v
        raise ValueError('Phone must be a valid Kenyan number')
 
 
class Farmer(FarmerBase):
    id: int
    is_active: bool
    created_at: datetime
 
    class Config:
        from_attributes = True