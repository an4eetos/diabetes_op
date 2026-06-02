from pydantic import BaseModel

from app.domain.enums import ShapDirection


class ShapFactor(BaseModel):
    feature_key: str
    label: str
    value: str | int | float | bool | None
    shap_value: float
    direction: ShapDirection
