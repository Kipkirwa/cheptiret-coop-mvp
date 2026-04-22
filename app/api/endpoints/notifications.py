from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.collection import DailyCollection
from app.models.farmer import Farmer
from app.models.price import MilkPrice
from app.services.sms import sms_service, format_milk_notification

router = APIRouter()

@router.post("/resend/{collection_id}")
async def resend_sms(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Resend SMS for a specific collection"""
    
    collection = db.query(DailyCollection).filter(DailyCollection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    farmer = db.query(Farmer).filter(Farmer.id == collection.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Get current price
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
    
    price = current_price.price_per_liter if current_price else 45.0
    
    # Send SMS
    message = format_milk_notification(farmer.name, collection.liters, price)
    sms_result = sms_service.send(
        phone_number=farmer.phone,
        message=message,
        db=db,
        farmer_id=farmer.id
    )
    
    # Update collection
    collection.sms_sent = True
    collection.sms_sent_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": sms_result["status"] in ["sent", "simulated"],
        "message": "SMS resent successfully",
        "collection_id": collection_id,
        "status": sms_result["status"]
    }