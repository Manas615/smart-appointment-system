from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import appointments

Base.metadata.create_all(bind=engine)

app = FastAPI()

# NEW: Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router, prefix="/api/v1/appointments")

@app.get("/health")
def health():
    return {"status": "ok"}
