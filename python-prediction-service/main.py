"""
QueueCheck - AI Waiting-Time Prediction Microservice
FastAPI service designed to serve scikit-learn gradient boosting regression models
for patient wait-time prediction in Chennai healthcare centers.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import datetime
from model import WaitTimePredictor

app = FastAPI(
    title="QueueCheck AI Prediction Service",
    description="Microservice for predicting patient wait times using historical queue dynamics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = WaitTimePredictor()

class PredictionRequest(BaseModel):
    queue_id: str
    token_number: str
    patients_ahead: int = Field(..., ge=0, description="Number of patients in queue ahead")
    doctor_specialty: str = Field(..., description="E.g., General Medicine, Pediatrics, Cardiology")
    hour_of_day: int = Field(default_factory=lambda: datetime.datetime.now().hour)
    day_of_week: int = Field(default_factory=lambda: datetime.datetime.now().weekday())
    category: str = Field(default="general", description="general, followup, emergency, senior")
    doctor_baseline_duration: float = Field(default=7.0, ge=1.0)
    queue_paused: bool = Field(default=False)
    historical_durations: Optional[List[float]] = None

class PredictionResponse(BaseModel):
    estimated_minutes: int
    lower_estimate: int
    upper_estimate: int
    confidence_level: str
    model_version: str
    calculated_at: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "QueueCheck AI Waiting-Time Engine",
        "model_loaded": predictor.is_ready()
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_wait_time(request: PredictionRequest):
    try:
        result = predictor.predict(
            patients_ahead=request.patients_ahead,
            specialty=request.doctor_specialty,
            hour_of_day=request.hour_of_day,
            day_of_week=request.day_of_week,
            category=request.category,
            baseline_duration=request.doctor_baseline_duration,
            is_paused=request.queue_paused,
            historical_durations=request.historical_durations or []
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
