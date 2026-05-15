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
from app.services.screening_service import ScreeningService


router = APIRouter()


@router.post("/patients/{patient_id}", response_model=ScreeningRead, status_code=status.HTTP_201_CREATED)
def create_screening(
    patient_id: uuid.UUID,
    payload: ScreeningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Screening:
    screening = ScreeningService(db).create(patient_id, current_user.id, payload)
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    AuditService(db).log(
        actor_user_id=current_user.id,
        action=AuditAction.SCREENING_CREATED.value,
        entity_type="screening",
        entity_id=str(screening.id),
        metadata={
            "risk_category": screening.risk_category.value,
            "algorithm_version": screening.algorithm_version,
        },
    )
    db.commit()
    return screening


@router.get("/{screening_id}", response_model=ScreeningRead)
def get_screening(
    screening_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Screening:
    screening = ScreeningRepository(db).get(screening_id)
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screening not found")
    return screening

