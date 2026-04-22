from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Farmer(Base):
    __tablename__ = "farmers"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    has_smartphone = Column(Boolean, default=False)
    pin_hash = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Keep collections, remove sms_logs for now
    collections = relationship("DailyCollection", back_populates="farmer", lazy="dynamic")
    # sms_logs = relationship("SMSLog", back_populates="farmer")  # REMOVED