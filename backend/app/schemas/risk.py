from pydantic import BaseModel, Field

from app.domain.enums import RiskCategory, Sex


class RiskInput(BaseModel):
    age: int = Field(ge=18, le=120)
    sex: Sex
    diabetes_duration_years: float = Field(ge=0, le=80)
    hba1c_percent: float = Field(ge=3, le=18)
    previous_low_energy_fractures: bool = False
    previous_myocardial_infarction: bool = False
    previous_stroke: bool = False
    bmi: float | None = Field(default=None, ge=10, le=80)
    egfr: float | None = Field(default=None, ge=0, le=200)
    creatinine_umol_l: float | None = Field(default=None, ge=10, le=1500)
    bone_metabolism_markers: dict[str, str | float | int | bool | None] | None = None


class RiskRuleContribution(BaseModel):
    risk_type: str
    field: str
    points: int
    reason: str


class RiskResult(BaseModel):
    total_risk: int
    vascular_risk: int
    skeletal_risk: int
    category: RiskCategory
    algorithm_version: str
    algorithm_disclaimer: str
    contributions: list[RiskRuleContribution] = []

