import uuid

from sqlalchemy.orm import Session

from app.db.models import Prediction


class PredictionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, prediction_id: uuid.UUID) -> Prediction | None:
        return self.db.get(Prediction, prediction_id)

    def add(self, prediction: Prediction) -> Prediction:
        self.db.add(prediction)
        self.db.flush()
        return prediction
