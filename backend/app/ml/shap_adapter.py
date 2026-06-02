from typing import Any

from app.ml.model_adapter import ModelAdapter
from app.schemas.shap import ShapFactor


class ShapAdapter:
    def __init__(self, model_adapter: ModelAdapter) -> None:
        self.model_adapter = model_adapter

    def explain(self, feature_vector: dict[str, Any], language: str) -> list[ShapFactor]:
        return self.model_adapter.explain(feature_vector, language)[:3]
