from datetime import date, datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import Sex


class PatientBase(BaseModel):
    medical_record_number: str | None = Field(default=None, max_length=80)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    middle_name: str | None = Field(default=None, max_length=120)
    date_of_birth: date | None = None
    sex: Sex
    phone: str | None = Field(default=None, max_length=60)
    notes: str | None = Field(default=None, max_length=2000)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    medical_record_number: str | None = Field(default=None, max_length=80)
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, min_length=1, max_length=120)
    middle_name: str | None = Field(default=None, max_length=120)
    date_of_birth: date | None = None
    sex: Sex | None = None
    phone: str | None = Field(default=None, max_length=60)
    notes: str | None = Field(default=None, max_length=2000)


class PatientRead(PatientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

