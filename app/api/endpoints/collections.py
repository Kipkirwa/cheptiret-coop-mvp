from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Optional
from datetime import date, datetime
import sys

from app.core.database import get_db
from app.core.security import verify_password
from app.core.deps import get_current_user, require_admin, require_transporter
from app.models.collection import DailyCollection
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.models.price import MilkPrice
from app.schemas.collection import CollectionCreate, Collection, FarmerCollectionSummary, CollectionResponse
from app.services.sms_working import sms_service
from app.services.sms import format_milk_notification

router = APIRouter()

@router.post("/record", response_model=Collection)
async def record_collection(
    collection: CollectionCreate,
    current_user = Depends(require_transporter),  # ✅ Only transporters and admins
    db: Session = Depends(get_db)
) -> Any:
    """
    ⭐ CORE FEATURE: Transporter records milk collection
    - Requires transporter or admin role
    - Records the liters
    - Automatically sends SMS to ALL farmers after every collection
    - Returns collection details
    """
    
    print("\n" + "="*50, flush=True)
    print("📝 RECORDING NEW MILK COLLECTION", flush=True)
    print("="*50, flush=True)
    print(f"👤 Recorded by: {current_user['name']} ({current_user['role']})", flush=True)
    
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
    
    # Find transporter (use current user if username not provided)
    transporter_username = getattr(collection, 'transporter_username', None)
    if not transporter_username:
        transporter_username = current_user['username']
    
    print(f"🔍 Looking for transporter: {transporter_username}", flush=True)
    transporter = db.query(Transporter).filter(
        Transporter.username == transporter_username,
        Transporter.is_active == True
    ).first()
    
    if not transporter:
        print(f"❌ Transporter not found: {transporter_username}", flush=True)
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
    
    # Send SMS to farmer after collection
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
        month_total=month_total
    )
    
    # Send SMS
    try:
        sms_service.send(farmer.phone, message, db, farmer.id)
        print(f"   ✅ SMS sent to: {farmer.phone}", flush=True)
        print(f"   📝 Message: {message[:100]}...", flush=True)
    except Exception as e:
        print(f"   ⚠️ SMS sending failed: {e}", flush=True)
    
    # Return response in correct format for Collection schema
    return Collection(
        id=db_collection.id,
        farmer_id=farmer.farmer_id,
        liters=db_collection.liters,
        collection_date=db_collection.collection_date,
        recorded_at=db_collection.recorded_at,
        transporter_name=transporter.name,
        sms_sent=db_collection.sms_sent,
        app_notification_sent=db_collection.app_notification_sent
    )


@router.get("/farmer/{farmer_id}/summary", response_model=FarmerCollectionSummary)
async def get_farmer_summary(
    farmer_id: str,
    current_user = Depends(get_current_user),  # ✅ Any authenticated user
    db: Session = Depends(get_db)
) -> Any:
    """Get collection summary for a specific farmer"""
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Farmers can only see their own data
    if current_user['role'] == 'farmer' and current_user.get('farmer_id') != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own data"
        )
    
    # Get today's collections
    today = date.today()
    today_collections = db.query(DailyCollection).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date == today
    ).all()
    today_total = sum(c.liters for c in today_collections)
    
    # Get current month collections
    first_of_month = date(today.year, today.month, 1)
    monthly_collections = db.query(DailyCollection).filter(
        DailyCollection.farmer_id == farmer.id,
        DailyCollection.collection_date >= first_of_month
    ).all()
    month_total = sum(c.liters for c in monthly_collections)
    
    # Get current milk price
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).first()
    
    estimated_payment = month_total * (current_price.price_per_liter if current_price else 0)
    
    return FarmerCollectionSummary(
        farmer_id=farmer.farmer_id,
        farmer_name=farmer.name,
        today_total=today_total,
        month_total=month_total,
        estimated_payment=estimated_payment
    )


@router.get("/transporter/{username}/today")
async def get_transporter_today_collections(
    username: str,
    current_user = Depends(require_transporter),  # ✅ Only transporters and admins
    db: Session = Depends(get_db)
) -> Any:
    """Get today's collections for a specific transporter"""
    
    # Admins can view any transporter, transporters can only view their own
    if current_user['role'] != 'admin' and current_user['username'] != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own collections"
        )
    
    transporter = db.query(Transporter).filter(Transporter.username == username).first()
    if not transporter:
        raise HTTPException(status_code=404, detail="Transporter not found")
    
    today = date.today()
    collections = db.query(DailyCollection).filter(
        DailyCollection.transporter_id == transporter.id,
        DailyCollection.collection_date == today
    ).all()
    
    result = []
    for c in collections:
        farmer = db.query(Farmer).filter(Farmer.id == c.farmer_id).first()
        result.append({
            "id": c.id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "farmer_id": farmer.farmer_id if farmer else "Unknown",
            "liters": c.liters,
            "time": c.recorded_at
        })
    
    return {
        "transporter": username,
        "date": today,
        "total_collections": len(result),
        "total_liters": sum(r["liters"] for r in result),
        "collections": result
    }


@router.get("/farmer/{farmer_id}/history", response_model=List[Collection])
async def get_farmer_history(
    farmer_id: str,
    limit: int = 30,
    current_user = Depends(get_current_user),  # ✅ Any authenticated user
    db: Session = Depends(get_db)
) -> Any:
    """Get collection history for a specific farmer"""
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Farmers can only see their own data
    if current_user['role'] == 'farmer' and current_user.get('farmer_id') != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own data"
        )
    
    collections = db.query(DailyCollection).filter(
        DailyCollection.farmer_id == farmer.id
    ).order_by(DailyCollection.collection_date.desc()).limit(limit).all()
    
    # Convert to Collection schema
    result = []
    for c in collections:
        transporter = db.query(Transporter).filter(Transporter.id == c.transporter_id).first()
        result.append(Collection(
            id=c.id,
            farmer_id=farmer.farmer_id,
            liters=c.liters,
            collection_date=c.collection_date,
            recorded_at=c.recorded_at,
            transporter_name=transporter.name if transporter else "Unknown",
            sms_sent=c.sms_sent,
            app_notification_sent=c.app_notification_sent
        ))
    
    return result


@router.get("/farmer/{farmer_id}/monthly/{year}/{month}")
async def get_farmer_monthly(
    farmer_id: str,
    year: int,
    month: int,
    current_user = Depends(get_current_user),  # ✅ Any authenticated user
    db: Session = Depends(get_db)
) -> Any:
    """Get monthly collection summary for a farmer"""
    
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Farmers can only see their own data
    if current_user['role'] == 'farmer' and current_user.get('farmer_id') != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own data"
        )
    
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
    
    total_liters = sum(c.liters for c in collections)
    daily_breakdown = [
        {"date": c.collection_date, "liters": c.liters}
        for c in collections
    ]
    
    return {
        "farmer_id": farmer.farmer_id,
        "farmer_name": farmer.name,
        "year": year,
        "month": month,
        "total_liters": total_liters,
        "collection_days": len(collections),
        "daily_breakdown": daily_breakdown
    }


@router.get("/admin/daily-summary")
async def get_admin_daily_summary(
    collection_date: Optional[date] = None,
    current_user = Depends(require_admin),  # ✅ Admin only
    db: Session = Depends(get_db)
) -> Any:
    """Get daily collection summary across all farmers - ADMIN ONLY"""
    
    target_date = collection_date or date.today()
    
    collections = db.query(DailyCollection).filter(
        DailyCollection.collection_date == target_date
    ).all()
    
    # Group by farmer
    farmer_summary = {}
    for c in collections:
        farmer = db.query(Farmer).filter(Farmer.id == c.farmer_id).first()
        if farmer:
            farmer_key = farmer.farmer_id
            if farmer_key not in farmer_summary:
                farmer_summary[farmer_key] = {
                    "farmer_name": farmer.name,
                    "liters": 0,
                    "collections": 0
                }
            farmer_summary[farmer_key]["liters"] += c.liters
            farmer_summary[farmer_key]["collections"] += 1
    
    total_liters = sum(c.liters for c in collections)
    
    return {
        "date": target_date,
        "total_farmers": len(farmer_summary),
        "total_collections": len(collections),
        "total_liters": total_liters,
        "farmer_details": farmer_summary
    }