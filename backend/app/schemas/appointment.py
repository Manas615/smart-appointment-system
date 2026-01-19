from pydantic import BaseModel, validator
from datetime import datetime

class AppointmentCreate(BaseModel):
    provider_id: str
    user_id: str
    start_time: datetime
    end_time: datetime
    reason: str | None = None

    @validator('end_time')
    def check_times(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v

class AppointmentResponse(AppointmentCreate):
    id: int
    status: str
    class Config:
        from_attributes = True
