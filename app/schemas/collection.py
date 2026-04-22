from pydantic import BaseModel, validator
from typing import Optional
from datetime import date, datetime

class CollectionBase(BaseModel):
    farmer_id: str
    liters: float
    
    @validator('liters')
    def validate_liters(cls, v):
        if v <= 0:
            raise ValueError('Liters must be positive')
        if v > 100:
            raise ValueError('Suspiciously high, please verify')
        return round(v, 2)

class CollectionCreate(CollectionBase):
    transporter_username: str

class Collection(CollectionBase):
    id: int
    collection_date: date
    recorded_at: datetime
    transporter_name: str
    sms_sent: bool
    app_notification_sent: bool
    
    class Config:
        from_attributes = True

class FarmerCollectionSummary(BaseModel):
    farmer_id: str
    farmer_name: str
    today_total: float
    month_total: float
    estimated_payment: float
    
    class Config:
        from_attributes = True

class CollectionResponse(Collection):
    """Extended collection response with farmer and transporter details"""
    farmer_name: Optional[str] = None
    transporter_name: Optional[str] = None

class DailySummary(BaseModel):
    """Summary of a single day's collections"""
    date: date
    total_liters: float
    collection_count: int
    collections: list[CollectionResponse]

class MonthlySummary(BaseModel):
    """Monthly summary for a farmer"""
    year: int
    month: int
    total_liters: float
    total_collections: int
    average_per_day: float
    estimated_payment: float
    price_per_liter: float
    collections: list[CollectionResponse]