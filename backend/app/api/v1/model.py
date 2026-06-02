from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.prediction import ModelStatus
from app.services.prediction_service import PredictionService


router = APIRouter()


@router.get("/status", response_model=ModelStatus)
def model_status(db: Session = Depends(get_db)) -> ModelStatus:
    return PredictionService(db).model_status()
