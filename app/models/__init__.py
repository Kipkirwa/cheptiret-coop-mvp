# Models module
from app.models.farmer import Farmer
from app.models.transporter import Transporter
from app.models.collection import DailyCollection
from app.models.price import MilkPrice

# This ensures all models are registered with SQLAlchemy
__all__ = ["Farmer", "Transporter", "DailyCollection", "MilkPrice"]