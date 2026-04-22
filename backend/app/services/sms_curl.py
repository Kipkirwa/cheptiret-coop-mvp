import subprocess
import warnings
from typing import Optional
from app.core.config import settings
from app.models.sms import SMSLog
from sqlalchemy.orm import Session

warnings.filterwarnings("ignore")

class SMSServiceCurl:
    def __init__(self):
        self.username = settings.AT_USERNAME
        self.api_key = settings.AT_API_KEY
        self.sender_id = settings.AT_SENDER_ID
        print("✅ SMS Curl Service initialized")
        
    def _format_phone(self, phone: str) -> str:
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            return "+254" + phone[1:]
        if phone.startswith("254") and not phone.startswith("+"):
            return "+" + phone
        if not phone.startswith("+"):
            return "+" + phone
        return phone

    def send(self, phone_number: str, message: str, db: Session, farmer_id: Optional[int] = None) -> dict:
        phone_number = self._format_phone(phone_number)
        
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
            # Use curl command (which works)
            cmd = [
                "curl", "-s", "-X", "POST",
                "https://api.sandbox.africastalking.com/version1/messaging",
                "-H", f"apiKey: {self.api_key}",
                "-H", "Content-Type: application/x-www-form-urlencoded",
                "-d", f"username={self.username}&to={phone_number}&message={message}&sender_id={self.sender_id}"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            response_text = result.stdout
            
            print(f"SMS Curl Response: {response_text[:200]}")
            
            if "Success" in response_text or "Sent" in response_text:
                sms_log.status = "sent"
                sms_log.message_id = "SENT_VIA_CURL"
                db.commit()
                print(f"✅ SMS sent successfully to {phone_number}")
                return {"message_id": "SENT", "status": "sent", "cost": 0.8}
            else:
                sms_log.status = "failed"
                sms_log.error = response_text
                db.commit()
                print(f"❌ SMS failed: {response_text}")
                return {"message_id": None, "status": "failed", "cost": 0.0}
                
        except Exception as e:
            sms_log.status = "failed"
            sms_log.error = str(e)
            db.commit()
            print(f"❌ SMS exception: {e}")
            return {"message_id": None, "status": "failed", "cost": 0.0}

# Create global instance
sms_service = SMSServiceCurl()
