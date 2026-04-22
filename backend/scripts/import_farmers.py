#!/usr/bin/env python3
"""
Import farmers from Excel file to database
Run: python scripts/import_farmers.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from app.core.database import SessionLocal
from app.models.farmer import Farmer
from app.core.security import get_password_hash

def import_farmers_from_excel(excel_path):
    """Import farmers from Excel file to database"""
    
    print("=" * 60)
    print("📥 IMPORTING FARMERS FROM EXCEL")
    print("=" * 60)
    
    # Read Excel file
    df = pd.read_excel(excel_path)
    
    print(f"\n📊 Found {len(df)} farmers in Excel file")
    
    db = SessionLocal()
    
    imported_count = 0
    skipped_count = 0
    errors = []
    
    for index, row in df.iterrows():
        try:
            # Skip header row if it contains column names
            if str(row.iloc[0]) in ['Farmer ID', 'farmer_id', 'ID']:
                continue
                
            # Map Excel columns to database fields
            farmer_id = str(row.iloc[0])  # Column A: Farmer ID
            name = str(row.iloc[1])        # Column B: Name
            phone_raw = str(row.iloc[2])   # Column C: Phone
            id_number = str(row.iloc[3])   # Column D: ID/Account Number
            
            # Skip if farmer_id is not a number (header row)
            if not farmer_id.isdigit():
                continue
            
            # Clean phone number (add +254 if missing)
            phone = phone_raw.strip()
            if phone.startswith('0'):
                phone = '+254' + phone[1:]
            elif phone.startswith('7'):
                phone = '+254' + phone
            elif not phone.startswith('+'):
                phone = '+' + phone
            
            # Generate default PIN (last 4 digits of ID number or farmer_id)
            if id_number.isdigit() and len(id_number) >= 4:
                default_pin = id_number[-4:]
            else:
                default_pin = farmer_id[-4:] if len(farmer_id) >= 4 else "1234"
            
            # Check if farmer already exists
            existing = db.query(Farmer).filter(
                (Farmer.farmer_id == farmer_id) | (Farmer.phone == phone)
            ).first()
            
            if existing:
                print(f"⚠️  Skipping {name} - already exists (ID: {existing.farmer_id})")
                skipped_count += 1
                continue
            
            # Create new farmer
            new_farmer = Farmer(
                farmer_id=farmer_id,
                name=name,
                phone=phone,
                has_smartphone=False,  # Default, can update later
                pin_hash=get_password_hash(default_pin),
                is_active=True
            )
            
            db.add(new_farmer)
            db.commit()
            db.refresh(new_farmer)
            
            print(f"✅ Imported: {name} (ID: {farmer_id}) - PIN: {default_pin}")
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {index + 1}: {str(e)}")
            db.rollback()
            print(f"❌ Error on row {index + 1}: {e}")
    
    db.close()
    
    print("\n" + "=" * 60)
    print("📊 IMPORT SUMMARY")
    print("=" * 60)
    print(f"✅ Imported: {imported_count} farmers")
    print(f"⚠️  Skipped: {skipped_count} farmers (already exist)")
    print(f"❌ Errors: {len(errors)}")
    
    if errors:
        print("\nErrors encountered:")
        for error in errors[:5]:  # Show first 5 errors
            print(f"  - {error}")
    
    print("\n💡 Default PIN format: Last 4 digits of ID/Account Number")
    print("   Farmers should change their PIN on first login")
    print("=" * 60)
    
    return imported_count

if __name__ == "__main__":
    excel_path = "/home/kipkirwa/Desktop/Chetiret Farmers.xlsx"
    
    if not os.path.exists(excel_path):
        print(f"❌ Excel file not found: {excel_path}")
        print("Please make sure the file exists at this location")
    else:
        import_farmers_from_excel(excel_path)
