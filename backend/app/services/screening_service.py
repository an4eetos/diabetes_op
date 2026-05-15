import uuid

from sqlalchemy.orm import Session

from app.db.models import Screening
from app.repositories.patient_repository import PatientRepository
from app.repositories.screening_repository import ScreeningRepository
from app.schemas.screening import ScreeningCreate
from app.services.recommendation_service import RecommendationService
from app.services.risk_service import RiskService


class ScreeningService:
    def __init__(self, db: Session):
        self.db = db
        self.patient_repository = PatientRepository(db)
        self.screening_repository = ScreeningRepository(db)
        self.risk_service = RiskService()
        self.recommendation_service = RecommendationService()

    def create(self, patient_id: uuid.UUID, performed_by_id: uuid.UUID, payload: ScreeningCreate) -> Screening | None:
        patient = self.patient_repository.get(patient_id)
        if not patient:
            return None

        risk = self.risk_service.calculate(payload)
        recommendations = self.recommendation_service.generate(risk)
        screening = Screening(
            patient_id=patient_id,
            performed_by_id=performed_by_id,
            **payload.model_dump(),
            total_risk=risk.total_risk,
            vascular_risk=risk.vascular_risk,
            skeletal_risk=risk.skeletal_risk,
            risk_category=risk.category,
            recommendation_items=recommendations,
            algorithm_version=risk.algorithm_version,
            algorithm_disclaimer=risk.algorithm_disclaimer,
        )
        self.screening_repository.add(screening)
        self.db.commit()
        self.db.refresh(screening)
        return screening

