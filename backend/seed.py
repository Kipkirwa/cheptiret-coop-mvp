"""
Cheptiret Coop - Test Data Seed Script
Run from your backend project root with:
    python seed.py
 
Creates:
- 1 Admin user        (role='admin')
- 1 Transporter       (role='transporter')
- 3 Farmers           (2 feature phone, 1 smartphone)
- 1 Milk price
- Sample collections for the current month
 
Safe to re-run — clears existing data first.
"""
 
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
 
from datetime import date, datetime, timedelta
from app.core.database import SessionLocal, engine, Base
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.models.collection import DailyCollection
from app.models.price import MilkPrice
from app.core.security import get_password_hash
 
# Create all tables if they don't exist
Base.metadata.create_all(bind=engine)
 
db = SessionLocal()
 
 
def clear_existing_data():
    print("🗑️  Clearing existing data...")
    db.query(DailyCollection).delete()
    db.query(MilkPrice).delete()
    db.query(Farmer).delete()
    db.query(Transporter).delete()
    db.commit()
    print("✅ Existing data cleared")
 
 
def create_milk_price():
    print("\n💰 Creating milk price...")
    price = MilkPrice(
        price_per_liter=45.0,
        effective_date=date.today(),
        is_active=True,
        created_by="admin"
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    print(f"✅ Milk price set: Ksh {price.price_per_liter}/L")
    return price
 
 
def create_admin():
    print("\n🔐 Creating admin user...")
    admin = Transporter(
        name="Cooperative Admin",
        phone="+254700000000",
        username="admin",
        password_hash=get_password_hash("admin123"),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"✅ Admin created: {admin.name}")
    print(f"   Username: admin")
    print(f"   Password: admin123")
    return admin
 
 
def create_transporter():
    print("\n🚛 Creating transporter...")
    transporter = Transporter(
        name="John Kibet",
        phone="+254711000001",
        username="transporter1",
        password_hash=get_password_hash("transport123"),
        role="transporter",
        is_active=True,
    )
    db.add(transporter)
    db.commit()
    db.refresh(transporter)
    print(f"✅ Transporter created: {transporter.name}")
    print(f"   Username: transporter1")
    print(f"   Password: transport123")
    return transporter
 
 
def create_farmers():
    print("\n👨‍🌾 Creating farmers...")
    farmers_data = [
        {
            "farmer_id": "CPT001",
            "name": "Mary Chebet",
            "phone": "+254722000001",
            "has_smartphone": False,
            "pin": "1234",
        },
        {
            "farmer_id": "CPT002",
            "name": "Peter Rotich",
            "phone": "+254733000002",
            "has_smartphone": False,
            "pin": "2345",
        },
        {
            "farmer_id": "CPT003",
            "name": "Grace Jelimo",
            "phone": "+254744000003",
            "has_smartphone": True,
            "pin": "3456",
        },
    ]
 
    farmers = []
    for f in farmers_data:
        farmer = Farmer(
            farmer_id=f["farmer_id"],
            name=f["name"],
            phone=f["phone"],
            has_smartphone=f["has_smartphone"],
            pin_hash=get_password_hash(f["pin"]),
            is_active=True,
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
        farmers.append(farmer)
        print(f"✅ Farmer: {farmer.name} ({farmer.farmer_id})")
        print(f"   Phone: {farmer.phone} | PIN: {f['pin']} | Smartphone: {farmer.has_smartphone}")
 
    return farmers
 
 
def create_collections(farmers, transporter):
    print("\n🥛 Creating sample collections...")
 
    today = date.today()
    first_of_month = date(today.year, today.month, 1)
 
    farmer_liters = {
        farmers[0].id: [18.5, 20.0, 17.5, 19.0, 21.5, 18.0, 20.5],
        farmers[1].id: [12.0, 13.5, 11.5, 14.0, 12.5, 13.0, 11.0],
        farmers[2].id: [25.0, 24.5, 26.0, 23.5, 25.5, 24.0, 26.5],
    }
 
    collection_count = 0
    current_date = first_of_month
    day_index = 0
 
    while current_date <= today:
        for farmer in farmers:
            liters_list = farmer_liters[farmer.id]
            liters = liters_list[day_index % len(liters_list)]
 
            collection = DailyCollection(
                farmer_id=farmer.id,
                transporter_id=transporter.id,
                liters=liters,
                collection_date=current_date,
                recorded_at=datetime.combine(
                    current_date,
                    datetime.min.time()
                ).replace(hour=7, minute=30),
                sms_sent=True,
                sms_sent_at=datetime.combine(
                    current_date,
                    datetime.min.time()
                ).replace(hour=7, minute=31),
                app_notification_sent=farmer.has_smartphone,
            )
            db.add(collection)
            collection_count += 1
 
        db.commit()
        current_date += timedelta(days=1)
        day_index += 1
 
    print(f"✅ Created {collection_count} collection records")
    print(f"   From {first_of_month} to {today}")
 
 
def print_summary(farmers):
    print("\n" + "=" * 55)
    print("✅ SEED COMPLETE — TEST CREDENTIALS")
    print("=" * 55)
 
    print("\n🔐 ADMIN LOGIN")
    print("   URL:      http://localhost:3000/login/admin")
    print("   Username: admin")
    print("   Password: admin123")
 
    print("\n🚛 TRANSPORTER LOGIN")
    print("   URL:      http://localhost:3000/login/transporter")
    print("   Username: transporter1")
    print("   Password: transport123")
 
    print("\n👨‍🌾 FARMER LOGINS")
    print("   URL: http://localhost:3000/login/farmer")
    pins = {"CPT001": "1234", "CPT002": "2345", "CPT003": "3456"}
    for f in farmers:
        print(f"\n   {f.name} ({f.farmer_id})")
        print(f"   Phone: {f.phone}")
        print(f"   PIN:   {pins[f.farmer_id]}")
        print(f"   Type:  {'Smartphone' if f.has_smartphone else 'Feature phone (receives SMS)'}")
 
    print("\n💰 MILK PRICE: Ksh 45.00 per litre")
    print("=" * 55)
 
 
if __name__ == "__main__":
    try:
        clear_existing_data()
        create_milk_price()
        create_admin()
        transporter = create_transporter()
        farmers = create_farmers()
        create_collections(farmers, transporter)
        print_summary(farmers)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()