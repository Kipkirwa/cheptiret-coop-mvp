from sqlalchemy import Column, Integer, Float, Boolean, DateTime, Date, String
from datetime import datetime
from app.core.database import Base

class MilkPrice(Base):
    __tablename__ = "milk_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    price_per_liter = Column(Float, nullable=False)
    effective_date = Column(Date, default=datetime.utcnow().date, nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)