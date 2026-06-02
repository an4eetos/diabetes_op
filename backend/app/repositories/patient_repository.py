import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models import Patient


class PatientRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, patient_id: uuid.UUID) -> Patient | None:
        return self.db.get(Patient, patient_id)

    def get_by_external_id(self, patient_external_id: str) -> Patient | None:
        return self.db.scalar(select(Patient).where(Patient.patient_external_id == patient_external_id))

    def list(self, q: str | None = None, limit: int = 25, offset: int = 0) -> list[Patient]:
        profile_filter = or_(
            Patient.first_name.is_not(None),
            Patient.last_name.is_not(None),
            Patient.medical_record_number.is_not(None),
        )
        stmt = (
            select(Patient)
            .where(profile_filter)
            .order_by(Patient.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if q:
            pattern = f"%{q}%"
            stmt = (
                select(Patient)
                .where(
                    or_(
                        Patient.patient_external_id.ilike(pattern),
                        Patient.first_name.ilike(pattern),
                        Patient.last_name.ilike(pattern),
                        Patient.medical_record_number.ilike(pattern),
                    )
                )
                .where(profile_filter)
                .order_by(Patient.updated_at.desc())
                .limit(limit)
                .offset(offset)
            )
        return list(self.db.scalars(stmt))

    def add(self, patient: Patient) -> Patient:
        self.db.add(patient)
        self.db.flush()
        return patient
