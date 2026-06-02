from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE_REGISTRAR = "nurse_registrar"


class Sex(str, Enum):
    FEMALE = "female"
    MALE = "male"
    OTHER = "other"


class MenopauseStatus(str, Enum):
    PREMENOPAUSE = "premenopause"
    PERIMENOPAUSE = "perimenopause"
    POSTMENOPAUSE = "postmenopause"
    # Legacy values kept so existing rows from the previous prototype remain readable.
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"


class RiskCategory(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PredictionRiskCategory(str, Enum):
    LOW = "low"
    BORDERLINE = "borderline"
    HIGH = "high"


class DiabetesDuration(str, Enum):
    LT_5 = "lt_5"
    BETWEEN_5_10 = "between_5_10"
    GT_10 = "gt_10"


class ShapDirection(str, Enum):
    INCREASES_RISK = "increases_risk"
    DECREASES_RISK = "decreases_risk"


class AuditAction(str, Enum):
    USER_LOGIN = "user_login"
    PATIENT_CREATED = "patient_created"
    PATIENT_UPDATED = "patient_updated"
    SCREENING_CREATED = "screening_created"
    PREDICTION_CREATED = "prediction_created"
    PDF_EXPORTED = "pdf_exported"
