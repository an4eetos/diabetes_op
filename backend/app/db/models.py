from datetime import UTC, date, datetime
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.domain.enums import MenopauseStatus, RiskCategory, Sex, UserRole


def utc_now() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default="ru", nullable=False)

    screenings: Mapped[list["Screening"]] = relationship(back_populates="performed_by")


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_external_id: Mapped[str | None] = mapped_column(String(120), unique=True, index=True, nullable=True)
    medical_record_number: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    middle_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    sex: Mapped[Sex | None] = mapped_column(Enum(Sex, name="sex"), nullable=True)
    menopause_status: Mapped[MenopauseStatus | None] = mapped_column(Enum(MenopauseStatus, name="menopause_status"), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)

    screenings: Mapped[list["Screening"]] = relationship(back_populates="patient", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_patients_last_first_name", "last_name", "first_name"),
    )


class Screening(Base, TimestampMixin):
    __tablename__ = "screenings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("patients.id"), index=True, nullable=False)
    performed_by_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)

    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[Sex] = mapped_column(Enum(Sex, name="sex"), nullable=False)
    menopause_status: Mapped[MenopauseStatus | None] = mapped_column(Enum(MenopauseStatus, name="menopause_status"), nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diabetes_duration: Mapped[str | None] = mapped_column(String(40), nullable=True)
    hba1c: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_polyneuropathy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_retinopathy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_nephropathy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    menopause_onset_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    postmenopause_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vitamin_d: Mapped[float | None] = mapped_column(Float, nullable=True)
    pth: Mapped[float | None] = mapped_column(Float, nullable=True)
    alkaline_phosphatase: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_calcium: Mapped[float | None] = mapped_column(Float, nullable=True)
    falls_last_12_months: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tug_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    hand_grip_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    t_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    diabetes_duration_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    hba1c_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    previous_low_energy_fractures: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    previous_myocardial_infarction: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    previous_stroke: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)

    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    egfr: Mapped[float | None] = mapped_column(Float, nullable=True)
    creatinine_umol_l: Mapped[float | None] = mapped_column(Float, nullable=True)
    bone_metabolism_markers: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    total_risk: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vascular_risk: Mapped[int | None] = mapped_column(Integer, nullable=True)
    skeletal_risk: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_category: Mapped[RiskCategory | None] = mapped_column(Enum(RiskCategory, name="risk_category"), nullable=True)
    recommendation_items: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    algorithm_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    algorithm_disclaimer: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="screenings")
    performed_by: Mapped["User"] = relationship(back_populates="screenings")
    prediction: Mapped["Prediction"] = relationship(back_populates="screening", cascade="all, delete-orphan", uselist=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    screening_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("screenings.id"), index=True, nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_category: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    recommendation_code: Mapped[str] = mapped_column(String(80), nullable=False)
    shap_factors_json: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    model_type: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    screening: Mapped["Screening"] = relationship(back_populates="prediction")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    meta: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
