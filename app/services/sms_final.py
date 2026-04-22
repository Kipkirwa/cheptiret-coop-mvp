import subprocess
import warnings
import urllib.parse
from typing import Optional
from app.core.config import settings
from app.models.sms import SMSLog
from sqlalchemy.orm import Session

warnings.filterwarnings("ignore")

class SMSServiceFinal:
    def __init__(self):
        self.username = settings.AT_USERNAME
        self.api_key = settings.AT_API_KEY
        self.sender_id = settings.AT_SENDER_ID
        print("✅ SMS Final Service initialized")
        
    def _format_phone(self, phone: str) -> str:
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            return "254" + phone[1:]
        if phone.startswith("+"):
            return phone[1:]
        return phone

    def send(self, phone_number: str, message: str, db: Session, farmer_id: Optional[int] = None) -> dict:
        formatted_phone = self._format_phone(phone_number)
        
        # URL-encode the message to handle spaces and special characters
        encoded_message = urllib.parse.quote(message)
        
        # Create log entry
        sms_log = SMSLog(
            farmer_id=farmer_id,
            phone_number=phone_number,
            message=message,
            status="pending",
        )
        db.add(sms_log)
        db.commit()
        db.refresh(sms_log)
        
        try:
            # Use curl with URL-encoded message
            cmd = f'curl -s -X POST "https://api.sandbox.africastalking.com/version1/messaging" -H "apiKey: {self.api_key}" -H "Content-Type: application/x-www-form-urlencoded" -d "username={self.username}&to={formatted_phone}&message={encoded_message}&sender_id={self.sender_id}"'
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            response_text = result.stdout
            
            print(f"SMS Response: {response_text[:200] if response_text else 'Empty'}")
            
            if "Success" in response_text or "Sent" in response_text:
                sms_log.status = "sent"
                sms_log.message_id = "SENT"
                db.commit()
                print(f"✅ SMS sent successfully to {phone_number}")
                return {"message_id": "SENT", "status": "sent", "cost": 0.8}
            else:
                sms_log.status = "failed"
                sms_log.error = response_text if response_text else "No response"
                db.commit()
                print(f"❌ SMS failed: {response_text}")
                return {"message_id": None, "status": "failed", "cost": 0.0}
                
        except Exception as e:
            sms_log.status = "failed"
            sms_log.error = str(e)
            db.commit()
            print(f"❌ SMS exception: {e}")
            return {"message_id": None, "status": "failed", "cost": 0.0}

sms_service = SMSServiceFinal()
