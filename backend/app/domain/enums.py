from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE_REGISTRAR = "nurse_registrar"


class Sex(str, Enum):
    FEMALE = "female"
    MALE = "male"
    OTHER = "other"


class RiskCategory(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AuditAction(str, Enum):
    USER_LOGIN = "user_login"
    PATIENT_CREATED = "patient_created"
    PATIENT_UPDATED = "patient_updated"
    SCREENING_CREATED = "screening_created"
    PDF_EXPORTED = "pdf_exported"

