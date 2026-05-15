import uuid

from sqlalchemy.orm import Session

from app.db.models import Patient
from app.repositories.patient_repository import PatientRepository
from app.schemas.patient import PatientCreate, PatientUpdate


class PatientService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PatientRepository(db)

    def create(self, payload: PatientCreate, created_by_id: uuid.UUID) -> Patient:
        patient = Patient(**payload.model_dump(), created_by_id=created_by_id)
        self.repository.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def update(self, patient_id: uuid.UUID, payload: PatientUpdate) -> tuple[Patient | None, list[str]]:
        patient = self.repository.get(patient_id)
        if not patient:
            return None, []

        data = payload.model_dump(exclude_unset=True)
        changed_fields: list[str] = []
        for field, value in data.items():
            if getattr(patient, field) != value:
                setattr(patient, field, value)
                changed_fields.append(field)

        self.db.commit()
        self.db.refresh(patient)
        return patient, changed_fields

