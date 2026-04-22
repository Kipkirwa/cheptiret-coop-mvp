from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Any
from datetime import date, datetime, timedelta
from pydantic import BaseModel
 
from app.core.database import get_db
from app.models.price import MilkPrice
from app.models.collection import DailyCollection
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.schemas.price import MilkPriceCreate, MilkPrice as MilkPriceSchema
from app.services.sms import sms_service
 
router = APIRouter()
 
 
# ── Schemas (new) ──────────────────────────────────────────────────────────────
 
class BroadcastSMSRequest(BaseModel):
    message: str
    farmer_ids: Optional[List[str]] = None  # None = send to ALL active farmers
 
 
class BroadcastSMSResponse(BaseModel):
    total_sent: int
    total_failed: int
    total_simulated: int
    results: List[dict]
 
 
class CollectionCorrectionRequest(BaseModel):
    new_liters: float
    reason: str  # Required audit reason
 
 
# ── Existing: Price endpoints ──────────────────────────────────────────────────
 
@router.post("/price", response_model=MilkPriceSchema)
async def set_milk_price(
    price_data: MilkPriceCreate,
    db: Session = Depends(get_db)
):
    """Set current milk price (admin only)"""
 
    # Deactivate all previous prices
    db.query(MilkPrice).filter(MilkPrice.is_active == True).update(
        {MilkPrice.is_active: False}
    )
 
    # Create new price
    new_price = MilkPrice(
        price_per_liter=price_data.price_per_liter,
        effective_date=date.today(),
        is_active=True,
        created_by="admin"
    )
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
 
    return new_price
 
 
@router.get("/price/current")
async def get_current_price(db: Session = Depends(get_db)):
    """Get current active milk price"""
    price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
 
    if not price:
        return {"price_per_liter": 45.0, "message": "Using default price"}
 
    return price
 
 
# ── Existing: Dashboard summary (kept) + New: Full stats endpoint ──────────────
 
@router.get("/price/history")
async def get_price_history(db: Session = Depends(get_db)):
    """Get all historical milk prices ordered by most recent first"""
    prices = db.query(MilkPrice).order_by(MilkPrice.effective_date.desc()).all()
    return prices
 
 
@router.get("/dashboard/summary")
async def get_admin_dashboard_summary(db: Session = Depends(get_db)):
    """Get summary statistics for admin dashboard (original endpoint)"""
    today = date.today()
    first_of_month = date(today.year, today.month, 1)
 
    today_total = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.collection_date == today
    ).scalar() or 0.0
 
    today_count = db.query(DailyCollection).filter(
        DailyCollection.collection_date == today
    ).count()
 
    month_total = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.collection_date >= first_of_month,
        DailyCollection.collection_date <= today
    ).scalar() or 0.0
 
    total_farmers = db.query(Farmer).filter(Farmer.is_active == True).count()
    total_transporters = db.query(Transporter).filter(Transporter.is_active == True).count()
 
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
 
    price = current_price.price_per_liter if current_price else 45.0
 
    return {
        "date": today.isoformat(),
        "today": {
            "total_liters": round(today_total, 2),
            "total_collections": today_count,
            "estimated_payout": round(today_total * price, 2)
        },
        "month": {
            "total_liters": round(month_total, 2),
            "estimated_payout": round(month_total * price, 2)
        },
        "statistics": {
            "active_farmers": total_farmers,
            "active_transporters": total_transporters,
            "current_price_per_liter": price
        }
    }
 
 
@router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)) -> Any:
    """
    Extended stats for the new admin dashboard —
    includes SMS delivery rate and recent activity feed.
    """
    today = date.today()
    first_of_month = date(today.year, today.month, 1)
 
    total_farmers = db.query(Farmer).filter(Farmer.is_active == True).count()
    total_transporters = db.query(Transporter).filter(Transporter.is_active == True).count()
 
    today_liters = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.collection_date == today
    ).scalar() or 0.0
 
    month_liters = db.query(func.sum(DailyCollection.liters)).filter(
        DailyCollection.collection_date >= first_of_month,
        DailyCollection.collection_date <= today
    ).scalar() or 0.0
 
    today_collections = db.query(DailyCollection).filter(
        DailyCollection.collection_date == today
    ).count()
 
    today_sms_sent = db.query(DailyCollection).filter(
        DailyCollection.collection_date == today,
        DailyCollection.sms_sent == True
    ).count()
 
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
    price = current_price.price_per_liter if current_price else 45.0
 
    # Recent 10 collections across all farmers
    recent = db.query(DailyCollection).order_by(
        DailyCollection.recorded_at.desc()
    ).limit(10).all()
 
    recent_activity = []
    for c in recent:
        farmer = db.query(Farmer).filter(Farmer.id == c.farmer_id).first()
        transporter = db.query(Transporter).filter(Transporter.id == c.transporter_id).first()
        recent_activity.append({
            "id": c.id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "farmer_id": farmer.farmer_id if farmer else "Unknown",
            "transporter_name": transporter.name if transporter else "Unknown",
            "liters": c.liters,
            "collection_date": c.collection_date,
            "recorded_at": c.recorded_at,
            "sms_sent": c.sms_sent,
        })
 
    return {
        "total_farmers": total_farmers,
        "total_transporters": total_transporters,
        "today_liters": round(today_liters, 2),
        "month_liters": round(month_liters, 2),
        "today_collections": today_collections,
        "today_sms_sent": today_sms_sent,
        "sms_delivery_rate": round(
            (today_sms_sent / today_collections * 100) if today_collections else 0, 1
        ),
        "current_price_per_liter": price,
        "recent_activity": recent_activity,
    }
 
 
# ── New: Broadcast SMS ─────────────────────────────────────────────────────────
 
@router.post("/broadcast-sms", response_model=BroadcastSMSResponse)
async def broadcast_sms(
    request: BroadcastSMSRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Send a broadcast SMS to all active farmers or a specific subset.
    farmer_ids=None sends to ALL active farmers.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
 
    query = db.query(Farmer).filter(Farmer.is_active == True)
    if request.farmer_ids:
        query = query.filter(Farmer.farmer_id.in_(request.farmer_ids))
 
    farmers = query.all()
 
    if not farmers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active farmers found for the given criteria"
        )
 
    results = []
    total_sent = 0
    total_failed = 0
    total_simulated = 0
 
    for farmer in farmers:
        if not farmer.phone:
            results.append({
                "farmer_id": farmer.farmer_id,
                "farmer_name": farmer.name,
                "phone": None,
                "status": "skipped",
                "reason": "No phone number on record",
            })
            total_failed += 1
            continue
 
        result = sms_service.send(
            phone_number=farmer.phone,
            message=request.message,
            db=db,
            farmer_id=farmer.id,
        )
 
        results.append({
            "farmer_id": farmer.farmer_id,
            "farmer_name": farmer.name,
            "phone": farmer.phone,
            "status": result["status"],
            "message_id": result.get("message_id"),
        })
 
        if result["status"] == "sent":
            total_sent += 1
        elif result["status"] == "simulated":
            total_simulated += 1
        else:
            total_failed += 1
 
    return {
        "total_sent": total_sent,
        "total_failed": total_failed,
        "total_simulated": total_simulated,
        "results": results,
    }
 
 
# ── New: Collection error correction ──────────────────────────────────────────
 
@router.patch("/collections/{collection_id}/correct")
async def correct_collection(
    collection_id: int,
    request: CollectionCorrectionRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Admin corrects a wrong liter entry.
    Requires a reason which is saved as an audit trail.
    """
    if request.new_liters <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liters must be greater than zero"
        )
 
    if not request.reason or not request.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A reason is required for any correction"
        )
 
    collection = db.query(DailyCollection).filter(
        DailyCollection.id == collection_id
    ).first()
 
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection record not found"
        )
 
    old_liters = collection.liters
    collection.liters = request.new_liters
 
    # Save audit fields if they exist on your model
    # If not yet added, run an Alembic migration to add these columns:
    # correction_reason = Column(String, nullable=True)
    # corrected_at = Column(DateTime, nullable=True)
    if hasattr(collection, 'correction_reason'):
        collection.correction_reason = request.reason
    if hasattr(collection, 'corrected_at'):
        collection.corrected_at = datetime.utcnow()
 
    db.commit()
    db.refresh(collection)
 
    farmer = db.query(Farmer).filter(Farmer.id == collection.farmer_id).first()
 
    return {
        "success": True,
        "collection_id": collection_id,
        "farmer_id": farmer.farmer_id if farmer else None,
        "farmer_name": farmer.name if farmer else "Unknown",
        "old_liters": old_liters,
        "new_liters": request.new_liters,
        "reason": request.reason,
        "corrected_at": datetime.utcnow(),
    }
 
 
# ── New: Monthly payment summary ──────────────────────────────────────────────
 
@router.get("/monthly-payments/{year}/{month}")
async def get_monthly_payments(
    year: int,
    month: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Full payment summary for all farmers for a given month.
    Used by admin to review and finalize monthly payments.
    """
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
 
    current_price = db.query(MilkPrice).filter(
        MilkPrice.is_active == True
    ).order_by(MilkPrice.effective_date.desc()).first()
    price = current_price.price_per_liter if current_price else 45.0
 
    farmers = db.query(Farmer).filter(Farmer.is_active == True).all()
 
    summary = []
    grand_total_liters = 0.0
    grand_total_payment = 0.0
 
    for farmer in farmers:
        total_liters = db.query(func.sum(DailyCollection.liters)).filter(
            DailyCollection.farmer_id == farmer.id,
            DailyCollection.collection_date >= start_date,
            DailyCollection.collection_date < end_date,
        ).scalar() or 0.0
 
        if total_liters == 0:
            continue  # Skip farmers with no collections this month
 
        total_payment = round(total_liters * price, 2)
        grand_total_liters += total_liters
        grand_total_payment += total_payment
 
        summary.append({
            "farmer_id": farmer.farmer_id,
            "farmer_name": farmer.name,
            "phone": farmer.phone,
            "total_liters": round(total_liters, 2),
            "price_per_liter": price,
            "total_payment": total_payment,
        })
 
    summary.sort(key=lambda x: x["total_payment"], reverse=True)
 
    return {
        "year": year,
        "month": month,
        "month_name": start_date.strftime("%B"),
        "price_per_liter": price,
        "total_farmers": len(summary),
        "grand_total_liters": round(grand_total_liters, 2),
        "grand_total_payment": round(grand_total_payment, 2),
        "farmers": summary,
    }