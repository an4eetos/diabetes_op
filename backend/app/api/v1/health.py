from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.prediction import HealthRead
from app.services.prediction_service import PredictionService


router = APIRouter()


@router.get("", response_model=HealthRead)
def health(db: Session = Depends(get_db)) -> HealthRead:
    return HealthRead(status="ok", model=PredictionService(db).model_status())
