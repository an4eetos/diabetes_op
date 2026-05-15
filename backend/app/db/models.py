from datetime import UTC, date, datetime
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.domain.enums import RiskCategory, Sex, UserRole


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
    medical_record_number: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    sex: Mapped[Sex] = mapped_column(Enum(Sex, name="sex"), nullable=False)
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
    diabetes_duration_years: Mapped[float] = mapped_column(Float, nullable=False)
    hba1c_percent: Mapped[float] = mapped_column(Float, nullable=False)
    previous_low_energy_fractures: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    previous_myocardial_infarction: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    previous_stroke: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    egfr: Mapped[float | None] = mapped_column(Float, nullable=True)
    creatinine_umol_l: Mapped[float | None] = mapped_column(Float, nullable=True)
    bone_metabolism_markers: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    total_risk: Mapped[int] = mapped_column(Integer, nullable=False)
    vascular_risk: Mapped[int] = mapped_column(Integer, nullable=False)
    skeletal_risk: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_category: Mapped[RiskCategory] = mapped_column(Enum(RiskCategory, name="risk_category"), nullable=False)
    recommendation_items: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    algorithm_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm_disclaimer: Mapped[str] = mapped_column(Text, nullable=False)

    patient: Mapped["Patient"] = relationship(back_populates="screenings")
    performed_by: Mapped["User"] = relationship(back_populates="screenings")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    meta: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
