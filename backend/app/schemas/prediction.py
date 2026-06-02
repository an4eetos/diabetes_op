from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.enums import PredictionRiskCategory
from app.schemas.screening import ScreeningInput
from app.schemas.shap import ShapFactor


class PredictionRequest(BaseModel):
    patient_id: str = Field(min_length=2, max_length=120)
    screening_data: ScreeningInput
    derived_features: dict[str, float | int | str | bool | None] | None = None
    language: str = Field(default="ru", pattern="^(ru|kk|en)$")


class PredictionRead(BaseModel):
    prediction_id: uuid.UUID
    screening_id: uuid.UUID
    probability: float = Field(ge=0, le=1)
    probability_percent: float = Field(ge=0, le=100)
    risk_category: PredictionRiskCategory
    shap_factors: list[ShapFactor]
    recommendation_code: str
    recommendation_text: str
    model_version: str
    model_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class PredictionStoredRead(BaseModel):
    id: uuid.UUID
    screening_id: uuid.UUID
    probability: float
    probability_percent: float
    risk_category: PredictionRiskCategory
    shap_factors: list[ShapFactor]
    recommendation_code: str
    recommendation_text: str
    model_version: str
    model_type: str
    created_at: datetime

    model_config = ConfigDict(protected_namespaces=())


class ModelStatus(BaseModel):
    model_loaded: bool
    model_version: str
    model_type: str
    explanation_available: bool
    development_mode: bool

    model_config = ConfigDict(protected_namespaces=())


class HealthRead(BaseModel):
    status: str
    model: ModelStatus


class ProbabilityCategoryInput(BaseModel):
    probability: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def validate_probability(self) -> "ProbabilityCategoryInput":
        return self
