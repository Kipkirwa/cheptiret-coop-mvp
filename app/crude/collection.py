from sqlalchemy.orm import Session
from sqlalchemy import and_, extract
from datetime import date, datetime, timedelta
from app.models.collection import DailyCollection
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.schemas.collection import CollectionCreate

def get_collection(db: Session, collection_id: int):
    return db.query(DailyCollection).filter(DailyCollection.id == collection_id).first()

def get_collections_by_farmer(
    db: Session, 
    farmer_id: int, 
    start_date: date = None, 
    end_date: date = None
):
    query = db.query(DailyCollection).filter(DailyCollection.farmer_id == farmer_id)
    
    if start_date:
        query = query.filter(DailyCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(DailyCollection.collection_date <= end_date)
    
    return query.order_by(DailyCollection.collection_date.desc()).all()

def get_collections_by_transporter(
    db: Session, 
    transporter_id: int, 
    start_date: date = None, 
    end_date: date = None
):
    query = db.query(DailyCollection).filter(DailyCollection.transporter_id == transporter_id)
    
    if start_date:
        query = query.filter(DailyCollection.collection_date >= start_date)
    if end_date:
        query = query.filter(DailyCollection.collection_date <= end_date)
    
    return query.order_by(DailyCollection.collection_date.desc()).all()

def get_todays_collections(db: Session, transporter_id: int = None):
    today = datetime.utcnow().date()
    query = db.query(DailyCollection).filter(DailyCollection.collection_date == today)
    
    if transporter_id:
        query = query.filter(DailyCollection.transporter_id == transporter_id)
    
    return query.order_by(DailyCollection.recorded_at.desc()).all()

def create_collection(db: Session, collection: CollectionCreate, transporter_id: int):
    db_collection = DailyCollection(
        farmer_id=collection.farmer_id,
        transporter_id=transporter_id,
        liters=collection.liters,
        collection_date=collection.collection_date or datetime.utcnow().date(),
        recorded_at=datetime.utcnow()
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

def update_collection(db: Session, collection_id: int, **kwargs):
    db_collection = get_collection(db, collection_id)
    if db_collection:
        for key, value in kwargs.items():
            setattr(db_collection, key, value)
        db.commit()
        db.refresh(db_collection)
    return db_collection

def delete_collection(db: Session, collection_id: int):
    db_collection = get_collection(db, collection_id)
    if db_collection:
        db.delete(db_collection)
        db.commit()
        return True
    return False

def get_farmer_monthly_summary(db: Session, farmer_id: int, year: int, month: int):
    collections = db.query(DailyCollection).filter(
        and_(
            DailyCollection.farmer_id == farmer_id,
            extract('year', DailyCollection.collection_date) == year,
            extract('month', DailyCollection.collection_date) == month
        )
    ).all()
    
    total_liters = sum(c.liters for c in collections)
    
    return {
        "total_liters": total_liters,
        "total_collections": len(collections),
        "collections": collections
    }

def mark_notification_sent(db: Session, collection_id: int, notification_type: str = "sms"):
    db_collection = get_collection(db, collection_id)
    if db_collection:
        if notification_type == "sms":
            db_collection.sms_sent = True
            db_collection.sms_sent_at = datetime.utcnow()
        else:
            db_collection.app_notification_sent = True
            db_collection.notification_sent_at = datetime.utcnow()
        db.commit()
        db.refresh(db_collection)
    return db_collection