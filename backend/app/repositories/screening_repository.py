import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Screening


class ScreeningRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, screening_id: uuid.UUID) -> Screening | None:
        return self.db.get(Screening, screening_id)

    def list_for_patient(self, patient_id: uuid.UUID) -> list[Screening]:
        return list(
            self.db.scalars(
                select(Screening)
                .where(Screening.patient_id == patient_id)
                .order_by(Screening.created_at.desc())
            )
        )

    def add(self, screening: Screening) -> Screening:
        self.db.add(screening)
        self.db.flush()
        return screening

