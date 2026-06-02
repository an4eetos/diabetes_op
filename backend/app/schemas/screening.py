from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.enums import DiabetesDuration, MenopauseStatus, Sex


class ScreeningInput(BaseModel):
    sex: Sex
    age: int = Field(ge=1, le=120)
    height_cm: int = Field(ge=140, le=220)
    weight_kg: int = Field(ge=40, le=200)
    bmi: float | None = Field(default=None, ge=0)
    diabetes_duration: DiabetesDuration
    hba1c: float = Field(ge=4.0, le=15.0)
    has_polyneuropathy: bool = False
    has_retinopathy: bool = False
    has_nephropathy: bool = False
    menopause_status: MenopauseStatus | None = None
    menopause_onset_age: int | None = Field(default=None, ge=30, le=70)
    postmenopause_duration: int | None = Field(default=None, ge=0)
    vitamin_d: float | None = Field(default=None, ge=0)
    pth: float | None = Field(default=None, ge=0)
    alkaline_phosphatase: int | None = Field(default=None, ge=0)
    total_calcium: float | None = Field(default=None, ge=0)
    egfr: int | None = Field(default=None, ge=0)
    falls_last_12_months: bool = False
    tug_seconds: float | None = Field(default=None, ge=0)
    hand_grip_kg: float | None = Field(default=None, ge=0)
    t_score: float | None = None

    @field_validator("sex")
    @classmethod
    def only_binary_sex_for_model(cls, value: Sex) -> Sex:
        if value == Sex.OTHER:
            raise ValueError("sex_must_be_male_or_female")
        return value

    @model_validator(mode="after")
    def normalize_derived_and_conditional_fields(self) -> "ScreeningInput":
        self.bmi = round(self.weight_kg / ((self.height_cm / 100) ** 2), 1)

        if self.sex != Sex.FEMALE:
            self.menopause_status = None
            self.menopause_onset_age = None
            self.postmenopause_duration = None
            return self

        if self.menopause_status in {MenopauseStatus.YES, MenopauseStatus.NO, MenopauseStatus.UNKNOWN}:
            raise ValueError("menopause_status_must_be_stage")
        if self.menopause_status is None:
            raise ValueError("menopause_status_required")
        if self.menopause_status != MenopauseStatus.POSTMENOPAUSE:
            self.menopause_onset_age = None
            self.postmenopause_duration = None
            return self
        if self.menopause_onset_age is None:
            raise ValueError("menopause_onset_age_required")
        if self.menopause_onset_age > self.age:
            raise ValueError("menopause_onset_age_cannot_exceed_age")

        self.postmenopause_duration = self.age - self.menopause_onset_age
        return self

    @property
    def age_warning(self) -> bool:
        return self.age < 40 or self.age > 70


class ScreeningCreate(BaseModel):
    patient_id: str = Field(min_length=2, max_length=120)
    screening_data: ScreeningInput


class ScreeningRead(ScreeningInput):
    id: uuid.UUID
    patient_id: uuid.UUID
    performed_by_id: uuid.UUID
    patient_external_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScreeningWithPatient(ScreeningRead):
    patient_name: str | None = None
