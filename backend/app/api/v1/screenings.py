import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Screening, User
from app.db.session import get_db
from app.domain.enums import AuditAction
from app.repositories.screening_repository import ScreeningRepository
from app.schemas.screening import ScreeningCreate, ScreeningRead
from app.services.audit_service import AuditService
from app.services.patient_service import PatientService
from app.services.screening_service import ScreeningService


router = APIRouter()


@router.post("", response_model=ScreeningRead, status_code=status.HTTP_201_CREATED)
def create_screening(
    payload: ScreeningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScreeningRead:
    patient = PatientService(db).get_or_create_by_external_id(payload.patient_id, created_by_id=current_user.id)
    screening = ScreeningService(db).create(patient.id, current_user.id, payload.screening_data)
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="patient_not_found")

    AuditService(db).log(
        actor_user_id=current_user.id,
        action=AuditAction.SCREENING_CREATED.value,
        entity_type="screening",
        entity_id=str(screening.id),
        metadata={"screening_id": str(screening.id)},
    )
    db.commit()
    db.refresh(screening)
    return ScreeningRead.model_validate(screening, from_attributes=True).model_copy(
        update={"patient_external_id": patient.patient_external_id}
    )


@router.get("/{screening_id}", response_model=ScreeningRead)
def get_screening(
    screening_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ScreeningRead:
    screening = ScreeningRepository(db).get(screening_id)
    if not screening or not screening.height_cm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="screening_not_found")
    return ScreeningRead.model_validate(screening, from_attributes=True).model_copy(
        update={"patient_external_id": screening.patient.patient_external_id if screening.patient else None}
    )
