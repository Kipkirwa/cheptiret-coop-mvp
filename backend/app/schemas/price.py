from pydantic import BaseModel
from datetime import date

class MilkPriceBase(BaseModel):
    price_per_liter: float

class MilkPriceCreate(MilkPriceBase):
    pass

class MilkPrice(MilkPriceBase):
    id: int
    effective_date: date
    is_active: bool
    
    class Config:
        from_attributes = True