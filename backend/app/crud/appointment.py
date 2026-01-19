from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate
from fastapi import HTTPException

def create_appointment(db: Session, appointment: AppointmentCreate):
    # Check for overlap: (StartA < EndB) and (EndA > StartB)
    overlap = db.query(Appointment).filter(
        and_(
            Appointment.provider_id == appointment.provider_id,
            Appointment.status != "CANCELLED",
            Appointment.start_time < appointment.end_time,
            Appointment.end_time > appointment.start_time
        )
    ).first()

    if overlap:
        raise HTTPException(status_code=409, detail="Time slot conflict detected.")

    db_item = Appointment(**appointment.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
