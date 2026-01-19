from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, default="SCHEDULED")
    reason = Column(String, nullable=True)
