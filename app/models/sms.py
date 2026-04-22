from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class SMSLog(Base):
    __tablename__ = "sms_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, nullable=True)  # REMOVED ForeignKey
    phone_number = Column(String(15), nullable=False)
    message = Column(String(500), nullable=False)
    status = Column(String(50))
    cost = Column(Float, default=1.0)
    sent_at = Column(DateTime, default=datetime.utcnow)
    message_id = Column(String(100), nullable=True)
    
    # NO RELATIONSHIP for now