from pydantic import BaseModel, validator
from datetime import datetime

class TransporterBase(BaseModel):
    name: str
    phone: str
    username: str

class TransporterCreate(TransporterBase):
    password: str
    
    @validator('phone')
    def validate_phone(cls, v):
        v = v.strip()
        if v.startswith('0'):
            v = '254' + v[1:]
        elif v.startswith('+'):
            v = v[1:]
        if not v.startswith('254'):
            raise ValueError('Phone must be Kenyan number')
        return v

class Transporter(TransporterBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True