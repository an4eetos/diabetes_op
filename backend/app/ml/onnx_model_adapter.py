from pathlib import Path
from typing import Any

from app.ml.mock_model_adapter import MockModelAdapter


class OnnxModelAdapter(MockModelAdapter):
    def __init__(self, model_path: Path | None, *, model_version: str) -> None:
        super().__init__(model_version=model_version)
        self.model_path = model_path
        self.model_type = "onnx"
        self.development_mode = model_path is None

    def load_model(self) -> None:
        if self.model_path is None:
            raise RuntimeError("onnx_model_path_not_configured")

    def build_feature_vector(self, features: dict[str, Any]) -> dict[str, float | int | str | bool | None]:
        return super().build_feature_vector(features)
