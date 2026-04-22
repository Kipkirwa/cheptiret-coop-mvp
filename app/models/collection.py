from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey, Date, String
from sqlalchemy.orm import relationship  
from datetime import datetime
from app.core.database import Base
 
class DailyCollection(Base):
    __tablename__ = "daily_collections"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    transporter_id = Column(Integer, ForeignKey("transporters.id"), nullable=False)
    collection_date = Column(Date, default=datetime.utcnow().date, nullable=False)
    liters = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    sms_sent = Column(Boolean, default=False)
    sms_sent_at = Column(DateTime, nullable=True)
    app_notification_sent = Column(Boolean, default=False)
    notification_sent_at = Column(DateTime, nullable=True)
 
    # Audit fields for admin corrections
    correction_reason = Column(String, nullable=True)
    corrected_at = Column(DateTime, nullable=True)
    
    # Relationships
    farmer = relationship("Farmer", back_populates="collections")
    transporter = relationship("Transporter", back_populates="collections")