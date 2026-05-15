from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.domain.enums import RiskCategory
from app.schemas.risk import RiskInput


class ScreeningCreate(RiskInput):
    pass


class ScreeningRead(RiskInput):
    id: uuid.UUID
    patient_id: uuid.UUID
    performed_by_id: uuid.UUID
    total_risk: int
    vascular_risk: int
    skeletal_risk: int
    risk_category: RiskCategory
    recommendation_items: list[str]
    algorithm_version: str
    algorithm_disclaimer: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScreeningWithPatient(ScreeningRead):
    patient_name: str

