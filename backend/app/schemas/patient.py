from datetime import date, datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.enums import MenopauseStatus, Sex


class PatientBase(BaseModel):
    patient_external_id: str | None = Field(default=None, min_length=2, max_length=120)
    medical_record_number: str | None = Field(default=None, max_length=80)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    middle_name: str | None = Field(default=None, max_length=120)
    date_of_birth: date | None = None
    sex: Sex | None = None
    menopause_status: MenopauseStatus | None = None
    phone: str | None = Field(default=None, max_length=60)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator(
        "patient_external_id",
        "medical_record_number",
        "first_name",
        "last_name",
        "middle_name",
        "phone",
        "notes",
        mode="before",
    )
    @classmethod
    def blank_string_to_none(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @model_validator(mode="after")
    def normalize_menopause_status(self) -> "PatientBase":
        if self.sex != Sex.FEMALE:
            self.menopause_status = None
        elif self.menopause_status is None:
            self.menopause_status = MenopauseStatus.UNKNOWN
        return self


class PatientCreate(PatientBase):
    @model_validator(mode="after")
    def require_profile_or_external_id(self) -> "PatientCreate":
        if self.patient_external_id:
            return self
        if not self.first_name or not self.last_name or not self.sex:
            raise ValueError("patient_profile_or_external_id_required")
        return self


class PatientRead(BaseModel):
    id: uuid.UUID
    patient_external_id: str | None = None
    medical_record_number: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    date_of_birth: date | None = None
    sex: Sex | None = None
    menopause_status: MenopauseStatus | None = None
    phone: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientUpdate(PatientBase):
    pass
