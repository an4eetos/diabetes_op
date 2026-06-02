import uuid

from sqlalchemy.orm import Session

from app.db.models import Screening
from app.repositories.patient_repository import PatientRepository
from app.repositories.screening_repository import ScreeningRepository
from app.schemas.screening import ScreeningInput


class ScreeningService:
    def __init__(self, db: Session):
        self.db = db
        self.patient_repository = PatientRepository(db)
        self.screening_repository = ScreeningRepository(db)

    def create(self, patient_id: uuid.UUID, performed_by_id: uuid.UUID, payload: ScreeningInput) -> Screening | None:
        patient = self.patient_repository.get(patient_id)
        if not patient:
            return None

        data = payload.model_dump(mode="json")
        screening = Screening(
            patient_id=patient_id,
            performed_by_id=performed_by_id,
            age=payload.age,
            sex=payload.sex,
            menopause_status=payload.menopause_status,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            bmi=payload.bmi,
            diabetes_duration=payload.diabetes_duration.value,
            hba1c=payload.hba1c,
            has_polyneuropathy=payload.has_polyneuropathy,
            has_retinopathy=payload.has_retinopathy,
            has_nephropathy=payload.has_nephropathy,
            menopause_onset_age=payload.menopause_onset_age,
            postmenopause_duration=payload.postmenopause_duration,
            vitamin_d=data.get("vitamin_d"),
            pth=data.get("pth"),
            alkaline_phosphatase=data.get("alkaline_phosphatase"),
            total_calcium=data.get("total_calcium"),
            egfr=data.get("egfr"),
            falls_last_12_months=payload.falls_last_12_months,
            tug_seconds=data.get("tug_seconds"),
            hand_grip_kg=data.get("hand_grip_kg"),
            t_score=data.get("t_score"),
        )
        self.screening_repository.add(screening)
        self.db.flush()
        return screening
