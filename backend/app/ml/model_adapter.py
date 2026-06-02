from abc import ABC, abstractmethod
from typing import Any

from app.schemas.shap import ShapFactor


class ModelAdapter(ABC):
    model_version: str
    model_type: str
    development_mode: bool

    @abstractmethod
    def load_model(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def build_feature_vector(self, features: dict[str, Any]) -> dict[str, float | int | str | bool | None]:
        raise NotImplementedError

    @abstractmethod
    def predict_proba(self, feature_vector: dict[str, Any]) -> float:
        raise NotImplementedError

    @abstractmethod
    def explain(self, feature_vector: dict[str, Any], language: str) -> list[ShapFactor]:
        raise NotImplementedError

    def status(self) -> dict[str, str | bool]:
        return {
            "model_loaded": True,
            "model_version": self.model_version,
            "model_type": self.model_type,
            "explanation_available": True,
            "development_mode": self.development_mode,
        }
