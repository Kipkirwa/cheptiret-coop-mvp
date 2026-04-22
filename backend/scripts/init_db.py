#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import SessionLocal, engine, Base
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.models.price import MilkPrice
from app.models.collection import DailyCollection
from app.models.sms import SMSLog  # ✅ ADD THIS LINE
from app.core.security import get_password_hash
from datetime import date

def init_db():
    print("🚀 Creating database tables...")
    # This will create ALL tables including sms_logs
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    if db.query(Farmer).count() > 0:
        print("✅ Database already initialized")
        return
    
    print("📝 Adding sample data...")
    
    # Add milk price
    price = MilkPrice(
        price_per_liter=47.0,
        effective_date=date.today(),
        is_active=True,
        created_by="system"
    )
    db.add(price)
    
    # Add transporter
    transporter = Transporter(
        name="John Kipchoge",
        phone="254712345678",
        username="john_transporter",
        password_hash=get_password_hash("trans123"),
        is_active=True
    )
    db.add(transporter)
    
    # Add farmer
    farmer = Farmer(
        farmer_id="CPT001",
        name="Mary Chebet",
        phone="254723456789",
        has_smartphone=False,
        pin_hash=get_password_hash("1234"),
        is_active=True
    )
    db.add(farmer)
    
    db.commit()
    print("✅ Sample data added!")
    print("\n👤 Test Transporter:")
    print("   Username: john_transporter")
    print("   Password: trans123")
    print("\n👩‍🌾 Test Farmer:")
    print("   Farmer ID: CPT001")
    print("   Phone: 254723456789")
    print("   PIN: 1234")

if __name__ == "__main__":
    init_db()