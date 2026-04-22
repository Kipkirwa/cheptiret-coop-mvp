from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Cheptiret Coop MVP"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./cheptiret.db"
    
    # Africa's Talking SMS
    AT_USERNAME: Optional[str] = None
    AT_API_KEY: Optional[str] = None
    AT_SENDER_ID: str = "CHEPTIRET"
    
    # JWT
    SECRET_KEY: str = "cheptiret-super-secret-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    
    # SMS
    SMS_COST_PER_MESSAGE: float = 1.0
    
    class Config:
        env_file = ".env"

settings = Settings()