from pydantic import BaseModel
from typing import Optional

class SMSRequest(BaseModel):
    phone_number: str
    message: str

class SMSResponse(BaseModel):
    message_id: Optional[str]
    status: str
    cost: float