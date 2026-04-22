from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Optional
from datetime import date, datetime
import sys
 
from app.core.database import get_db
from app.core.security import verify_password
from app.models.collection import DailyCollection
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.models.price import MilkPrice
from app.schemas.collection import CollectionCreate, Collection, FarmerCollectionSummary, CollectionResponse
from app.services.sms import sms_service, format_milk_notification
 
router = APIRouter()
 
@router.post("/record", response_model=Collection)
async def record_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    ⭐ CORE FEATURE: Transporter records milk collection
    - Records the liters
    - Automatically sends SMS to ALL farmers after every collection
    - Returns collection details
    """
    
    print("\n" + "="*50, flush=True)
    print("📝 RECORDING NEW MILK COLLECTION", flush=True)
    print("="*50, flush=True)
    
    # Find farmer
    print(f"🔍 Looking for farmer with ID: {collection.farmer_id}", flush=True)
    farmer = db.query(Farmer).filter(
        Farmer.farmer_id == collection.farmer_id,
        Farmer.is_active == True
    ).first()
    
    if not farmer:
        print(f"❌ Farmer not found: {collection.farmer_id}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found or inactive"
        )
    
    print(f"✅ Farmer found: {farmer.name}", flush=True)
    print(f"📱 Phone: {farmer.phone}", flush=True)
    print(f"📟 Has smartphone: {farmer.has_smartphone}", flush=True)
    
    # Find transporter
    print(f"🔍 Looking for transporter: {collection.transporter_username}", flush=True)
    transporter = db.query(Transporter).filter(
        Transporter.username == collection.transporter_username,
        Transporter.is_active == True
    ).first()
    
    if not transporter:
        print(f"❌ Transporter not found: {collection.transporter_username}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found or inactive"
        )
    
    print(f"✅ Transporter found: {transporter.name}", flush=True)
    
    # Create collection record
    print(f"📊 Creating collection record: {collection.liters}L", flush=True)
    db_collection = DailyCollection(
        farmer_id=farmer.id,
        transporter_id=transporter.id,
        liters=collection.liters,
        collection_date=date.today()
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    print(f"✅ Collection recorded with ID: {db_collection.id}", flush=True)
    
    # Send SMS to ALL farmers after every collection
    print(f"\n📱 SENDING SMS TO FARMER:", flush=True)
    print(f"   Farmer: {farmer.name} | Has smartphone: {farmer.has_smartphone}", flush=True)
    print("   📨 Preparing SMS...", flush=True)
 
    # Calculate cumulative liters for this farmer for the current month
    today = date.today()
    first_of_month = date(today.year, today.month, 1)
 
    month_total = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date >= first_of_month,
        DailyCollection.collection_date <= today,
    ).scalar() or 0.0
 
    print(f"   📊 Month total so far: {month_total}L", flush=True)
 
    message = format_milk_notification(
        farmer_name=farmer.name,
        liters=collection.liters,
        month_total=month_total,
    )
    print(f"   📝 SMS Message: {message}", flush=True)
    print(f"   📞 Sending to: {farmer.phone}", flush=True)
 
    print("   📤 Calling sms_service.send()...", flush=True)
    sms_result = sms_service.send(
        phone_number=farmer.phone,
        message=message,
        db=db,
        farmer_id=farmer.id
    )
    print(f"   📨 sms_service.send() returned: {sms_result}", flush=True)
 
    # Update collection with SMS status
    print("   ✅ Updating collection SMS status...", flush=True)
    db_collection.sms_sent = True
    db_collection.sms_sent_at = datetime.utcnow()
    db.commit()
    db.refresh(db_collection)
    print("   ✅ SMS status updated in database", flush=True)
    
    print("\n" + "="*50, flush=True)
    print("✅ RECORDING COMPLETE", flush=True)
    print("="*50 + "\n", flush=True)
    
    # Return collection details
    return {
        "id": db_collection.id,
        "farmer_id": farmer.farmer_id,
        "liters": db_collection.liters,
        "collection_date": db_collection.collection_date,
        "recorded_at": db_collection.recorded_at,
        "transporter_name": transporter.name,
        "sms_sent": db_collection.sms_sent,
        "app_notification_sent": db_collection.app_notification_sent
    }
 
@router.get("/farmer/{farmer_id}/summary", response_model=FarmerCollectionSummary)
async def get_farmer_summary(
    farmer_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get farmer's daily and monthly totals with estimated payment
    Used by the farmer app to display dashboard
    """
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    today = date.today()
    first_of_month = date(today.year, today.month, 1)
    
    # Today's total
    today_total = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date == today
    ).scalar() or 0.0
    
    # Month's total
    month_total = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date >= first_of_month,
        DailyCollection.collection_date <= today
    ).scalar() or 0.0
    
    # Get current price
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
    
    price = current_price.price_per_liter if current_price else 45.0
    
    return {
        "farmer_id": farmer.farmer_id,
        "farmer_name": farmer.name,
        "today_total": round(today_total, 2),
        "month_total": round(month_total, 2),
        "estimated_payment": round(month_total * price, 2)
    }
 
@router.get("/transporter/{username}/today")
async def get_transporter_today_collections(
    username: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all collections recorded by a transporter today
    Used for transporter's daily summary
    """
    
    transporter = db.query(Transporter).filter(Transporter.username == username).first()
    if not transporter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transporter not found"
        )
    
    today = date.today()
    collections = db.query(DailyCollection).filter(
        DailyCollection.transporter_id == transporter.id,
        DailyCollection.collection_date == today
    ).all()
    
    result = []
    total_liters = 0
    
    for c in collections:
        farmer = db.query(Farmer).filter(Farmer.id == c.farmer_id).first()
        result.append({
            "id": c.id,
            "farmer_id": farmer.farmer_id if farmer else "Unknown",
            "farmer_name": farmer.name if farmer else "Unknown",
            "liters": c.liters,
            "time": c.recorded_at.strftime("%H:%M"),
            "sms_sent": c.sms_sent
        })
        total_liters += c.liters
    
    return {
        "date": today.strftime("%Y-%m-%d"),
        "transporter": transporter.name,
        "total_collections": len(result),
        "total_liters": round(total_liters, 2),
        "collections": result
    }
 
@router.get("/farmer/{farmer_id}/history", response_model=List[Collection])
async def get_farmer_collections(
    farmer_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get farmer's collection history with optional date filtering
    Used for farmer's daily/monthly statements
    """
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    query = db.query(DailyCollection).filter(
        DailyCollection.farmer_id == farmer.id
    )
    
    if start_date:
        query = query.filter(DailyCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(DailyCollection.collection_date <= end_date)
    
    collections = query.order_by(
        DailyCollection.collection_date.desc(),
        DailyCollection.recorded_at.desc()
    ).all()
    
    result = []
    for c in collections:
        transporter = db.query(Transporter).filter(Transporter.id == c.transporter_id).first()
        result.append({
            "id": c.id,
            "farmer_id": farmer.farmer_id,
            "liters": c.liters,
            "collection_date": c.collection_date,
            "recorded_at": c.recorded_at,
            "transporter_name": transporter.name if transporter else "Unknown",
            "sms_sent": c.sms_sent,
            "app_notification_sent": c.app_notification_sent
        })
    
    return result
 
@router.get("/farmer/{farmer_id}/monthly/{year}/{month}")
async def get_farmer_monthly_statement(
    farmer_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get detailed monthly statement for a farmer
    Returns daily breakdown and total payment
    """
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    # Get collections for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    collections = db.query(DailyCollection).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date >= start_date,
        DailyCollection.collection_date < end_date
    ).order_by(DailyCollection.collection_date).all()
    
    # Get current price for the period
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
    price = current_price.price_per_liter if current_price else 45.0
    
    # Group by day
    daily_totals = {}
    for c in collections:
        date_str = c.collection_date.strftime("%Y-%m-%d")
        if date_str not in daily_totals:
            daily_totals[date_str] = 0
        daily_totals[date_str] += c.liters
    
    daily_breakdown = [
        {"date": date_str, "liters": round(liters, 2)}
        for date_str, liters in daily_totals.items()
    ]
    
    total_liters = sum(c.liters for c in collections)
    total_payment = total_liters * price
    
    return {
        "farmer_id": farmer.farmer_id,
        "farmer_name": farmer.name,
        "year": year,
        "month": month,
        "month_name": start_date.strftime("%B"),
        "total_liters": round(total_liters, 2),
        "price_per_liter": price,
        "total_payment": round(total_payment, 2),
        "collection_days": len(daily_totals),
        "daily_breakdown": daily_breakdown,
        "collections": [
            {
                "date": c.collection_date,
                "time": c.recorded_at.strftime("%H:%M"),
                "liters": c.liters,
                "transporter": db.query(Transporter).filter(Transporter.id == c.transporter_id).first().name
            }
            for c in collections
        ]
    }
 
@router.get("/admin/daily-summary")
async def get_admin_daily_summary(
    date_param: Optional[date] = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Admin view: Daily summary of all collections
    Shows totals by transporter and overall stats
    """
    
    target_date = date_param or date.today()
    
    # Get all collections for the date
    collections = db.query(DailyCollection).filter(
        DailyCollection.collection_date == target_date
    ).all()
    
    # Group by transporter
    transporter_totals = {}
    total_liters = 0
    total_farmers = set()
    
    for c in collections:
        total_liters += c.liters
        total_farmers.add(c.farmer_id)
        
        if c.transporter_id not in transporter_totals:
            transporter = db.query(Transporter).filter(Transporter.id == c.transporter_id).first()
            transporter_totals[c.transporter_id] = {
                "transporter_id": c.transporter_id,
                "transporter_name": transporter.name if transporter else "Unknown",
                "collections": [],
                "total_liters": 0
            }
        
        farmer = db.query(Farmer).filter(Farmer.id == c.farmer_id).first()
        transporter_totals[c.transporter_id]["collections"].append({
            "farmer_id": farmer.farmer_id if farmer else "Unknown",
            "farmer_name": farmer.name if farmer else "Unknown",
            "liters": c.liters,
            "time": c.recorded_at.strftime("%H:%M"),
            "sms_sent": c.sms_sent
        })
        transporter_totals[c.transporter_id]["total_liters"] += c.liters
    
    # Convert to list and sort
    transporter_summary = list(transporter_totals.values())
    for t in transporter_summary:
        t["collections"].sort(key=lambda x: x["time"])
        t["total_liters"] = round(t["total_liters"], 2)
    
    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "total_collections": len(collections),
        "total_farmers": len(total_farmers),
        "total_liters": round(total_liters, 2),
        "transporters": transporter_summary
    }