# QueueCheck AI Prediction Microservice

This microservice provides machine-learning waiting-time estimation for the QueueCheck platform.

## Architecture

- **Framework**: FastAPI (Asynchronous Python)
- **Model Engine**: Scikit-Learn regression with historical feature vectors (specialty, hour of day, queue length, rolling consultation variance)
- **Endpoint**: `POST /predict`

## Quick Start

```bash
cd python-prediction-service
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Example API Request

```json
POST /predict
{
  "queue_id": "queue-1",
  "token_number": "A028",
  "patients_ahead": 5,
  "doctor_specialty": "General Medicine",
  "hour_of_day": 11,
  "day_of_week": 2,
  "category": "general",
  "doctor_baseline_duration": 6.0,
  "queue_paused": false,
  "historical_durations": [5.5, 6.2, 5.8, 7.0, 5.1]
}
```
