import africastalking
from typing import Optional
from app.core.config import settings
from app.models.sms import SMSLog
from sqlalchemy.orm import Session
 
 
class SMSService:
    def __init__(self):
        if settings.AT_USERNAME and settings.AT_API_KEY:
            africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
            self.sms = africastalking.SMS
            self.initialized = True
            print("✅ Africa's Talking SMS initialized")
        else:
            print("⚠️  Africa's Talking not configured. SMS will be simulated.")
            self.initialized = False
 
    def _format_phone(self, phone: str) -> str:
        """
        Normalize Kenyan phone numbers to E.164 format (+254XXXXXXXXX).
        Handles: 07XXXXXXXX, 254XXXXXXXXX, +254XXXXXXXXX
        """
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            return "+254" + phone[1:]
        if phone.startswith("254") and not phone.startswith("+"):
            return "+" + phone
        return phone  # assume already in +254 format
 
    def send(
        self,
        phone_number: str,
        message: str,
        db: Session,
        farmer_id: Optional[int] = None,
    ) -> dict:
        """
        Send an SMS to a farmer and log the result to the database.
 
        Returns a dict with keys:
            message_id (str | None)
            status     ('sent' | 'simulated' | 'failed')
            cost       (float)
        """
        # Normalize phone number to +254 format
        phone_number = self._format_phone(phone_number)
 
        # Create pending log entry
        sms_log = SMSLog(
            farmer_id=farmer_id,
            phone_number=phone_number,
            message=message,
            status="pending",
        )
        db.add(sms_log)
        db.commit()
        db.refresh(sms_log)
 
        # Simulate if Africa's Talking credentials are not configured
        if not self.initialized:
            sms_log.status = "simulated"
            sms_log.message_id = "SIMULATED"
            db.commit()
            print(f"📱 [SMS SIMULATED] To: {phone_number}")
            print(f"   Message: {message}")
            return {"message_id": "SIMULATED", "status": "simulated", "cost": 0.0}
 
        # Send real SMS via Africa's Talking SDK
        try:
            response = self.sms.send(message, [phone_number], settings.AT_SENDER_ID)
 
            # Safely extract messageId from response
            recipients = response.get("SMSMessageData", {}).get("Recipients", [])
            message_id = (
                str(recipients[0].get("messageId", "UNKNOWN"))
                if recipients
                else "UNKNOWN"
            )
            at_status = recipients[0].get("status", "") if recipients else ""
 
            sms_log.status = "sent"
            sms_log.message_id = message_id
            sms_log.cost = settings.SMS_COST_PER_MESSAGE
            db.commit()
 
            print(f"✅ SMS sent to {phone_number} | messageId: {message_id} | AT status: {at_status}")
            return {
                "message_id": message_id,
                "status": "sent",
                "cost": sms_log.cost,
            }
 
        except Exception as e:
            sms_log.status = "failed"
            sms_log.error = str(e)
            db.commit()
            print(f"❌ SMS failed to {phone_number}: {str(e)}")
            return {"message_id": None, "status": "failed", "cost": 0.0}
 
 
def format_milk_notification(
    farmer_name: str,
    liters: float,
    month_total: float,
) -> str:
    """
    Format the SMS notification sent to a farmer after milk collection.
    Shows today's collection and cumulative monthly total.
    Kept under 160 chars to avoid multi-part SMS charges.
    """
    message = (
        f"Cheptiret Coop: Habari {farmer_name},\n"
        f"Leo: {liters}L\n"
        f"Jumla ya mwezi: {round(month_total, 2)}L\n"
        f"Asante kwa kazi nzuri!"
    )
    return message
 
 
# Global singleton — initialized once at startup
sms_service = SMSService()