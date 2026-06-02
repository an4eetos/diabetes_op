import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.prediction import PredictionRead, PredictionRequest
from app.services.prediction_service import PredictionService


router = APIRouter()


@router.post("", response_model=PredictionRead, status_code=status.HTTP_201_CREATED)
def create_prediction(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionRead:
    try:
        return PredictionService(db).create_prediction(payload, actor_user_id=current_user.id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/{prediction_id}", response_model=PredictionRead)
def get_prediction(
    prediction_id: uuid.UUID,
    language: str = Query(default="ru", pattern="^(ru|kk|en)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PredictionRead:
    prediction = PredictionService(db).get_prediction(prediction_id, language=language)
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="prediction_not_found")
    return prediction
