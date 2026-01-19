from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.crud import appointment as crud

router = APIRouter()

@router.post("/", response_model=AppointmentResponse)
def book(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    return crud.create_appointment(db, appointment)
