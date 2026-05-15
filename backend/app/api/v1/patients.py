import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Patient, User
from app.db.session import get_db
from app.domain.enums import AuditAction
from app.repositories.patient_repository import PatientRepository
from app.repositories.screening_repository import ScreeningRepository
from app.schemas.patient import PatientCreate, PatientRead, PatientUpdate
from app.schemas.screening import ScreeningRead
from app.services.audit_service import AuditService
from app.services.patient_service import PatientService


router = APIRouter()


@router.get("", response_model=list[PatientRead])
def list_patients(
    q: str | None = None,
    limit: int = 25,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Patient]:
    return PatientRepository(db).list(q=q, limit=limit, offset=offset)


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Patient:
    try:
        patient = PatientService(db).create(payload, created_by_id=current_user.id)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Medical record number already exists") from exc

    AuditService(db).log(
        actor_user_id=current_user.id,
        action=AuditAction.PATIENT_CREATED.value,
        entity_type="patient",
        entity_id=str(patient.id),
    )
    db.commit()
    return patient


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Patient:
    patient = PatientRepository(db).get(patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Patient:
    try:
        patient, changed_fields = PatientService(db).update(patient_id, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Medical record number already exists") from exc
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    AuditService(db).log(
        actor_user_id=current_user.id,
        action=AuditAction.PATIENT_UPDATED.value,
        entity_type="patient",
        entity_id=str(patient.id),
        metadata={"changed_fields": changed_fields},
    )
    db.commit()
    return patient


@router.get("/{patient_id}/screenings", response_model=list[ScreeningRead])
def list_patient_screenings(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not PatientRepository(db).get(patient_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return ScreeningRepository(db).list_for_patient(patient_id)

