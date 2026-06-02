from typing import Any

from app.domain.enums import ShapDirection
from app.ml.feature_builder import build_features
from app.ml.model_adapter import ModelAdapter
from app.schemas.screening import ScreeningInput
from app.schemas.shap import ShapFactor


FEATURE_LABELS: dict[str, dict[str, str]] = {
    "diabetes_duration": {
        "ru": "Длительность СД2",
        "kk": "2-типті диабет ұзақтығы",
        "en": "Type 2 diabetes duration",
    },
    "hba1c": {"ru": "HbA1c", "kk": "HbA1c", "en": "HbA1c"},
    "bmi": {"ru": "ИМТ", "kk": "ДСИ", "en": "BMI"},
    "postmenopause_duration": {
        "ru": "Длительность постменопаузы",
        "kk": "Постменопауза ұзақтығы",
        "en": "Postmenopause duration",
    },
    "falls_last_12_months": {
        "ru": "Падения за последние 12 месяцев",
        "kk": "Соңғы 12 айдағы құлау",
        "en": "Falls in last 12 months",
    },
    "tug_seconds": {"ru": "Тест TUG", "kk": "TUG тесті", "en": "TUG test"},
    "vitamin_d": {"ru": "Витамин D", "kk": "D дәрумені", "en": "Vitamin D"},
    "egfr": {"ru": "eGFR", "kk": "eGFR", "en": "eGFR"},
}


class MockModelAdapter(ModelAdapter):
    def __init__(self, *, model_version: str = "mock-osteorisk-v1") -> None:
        self.model_version = model_version
        self.model_type = "mock"
        self.development_mode = True

    def load_model(self) -> None:
        return None

    def build_feature_vector(self, features: dict[str, Any]) -> dict[str, float | int | str | bool | None]:
        return features

    def predict_proba(self, feature_vector: dict[str, Any]) -> float:
        score = 0.05
        age = int(feature_vector["age"])
        bmi = float(feature_vector["bmi"])
        hba1c = float(feature_vector["hba1c"])

        if age >= 60:
            score += 0.12
        if feature_vector.get("diabetes_duration") == "between_5_10":
            score += 0.08
        if feature_vector.get("diabetes_duration") == "gt_10":
            score += 0.18
        if hba1c >= 8:
            score += 0.11
        if bmi < 20:
            score += 0.1
        if feature_vector.get("is_postmenopause"):
            score += min(0.16, 0.02 * float(feature_vector.get("postmenopause_duration") or 0))
        if feature_vector.get("falls_last_12_months"):
            score += 0.12
        if (feature_vector.get("tug_seconds") or 0) >= 20:
            score += 0.1
        if (feature_vector.get("vitamin_d") is not None) and float(feature_vector["vitamin_d"]) < 20:
            score += 0.08
        if (feature_vector.get("egfr") is not None) and float(feature_vector["egfr"]) < 60:
            score += 0.06
        if feature_vector.get("has_polyneuropathy"):
            score += 0.05
        if feature_vector.get("has_nephropathy"):
            score += 0.05

        return round(max(0, min(1, score)), 4)

    def explain(self, feature_vector: dict[str, Any], language: str) -> list[ShapFactor]:
        lang = language if language in {"ru", "kk", "en"} else "ru"
        candidates: list[tuple[str, Any, float, ShapDirection]] = [
            ("diabetes_duration", feature_vector.get("diabetes_duration"), self._duration_weight(feature_vector), ShapDirection.INCREASES_RISK),
            ("hba1c", feature_vector.get("hba1c"), 0.11 if float(feature_vector.get("hba1c") or 0) >= 8 else -0.03, ShapDirection.INCREASES_RISK if float(feature_vector.get("hba1c") or 0) >= 8 else ShapDirection.DECREASES_RISK),
            ("bmi", feature_vector.get("bmi"), 0.1 if float(feature_vector.get("bmi") or 0) < 20 else -0.02, ShapDirection.INCREASES_RISK if float(feature_vector.get("bmi") or 0) < 20 else ShapDirection.DECREASES_RISK),
            ("falls_last_12_months", feature_vector.get("falls_last_12_months"), 0.12 if feature_vector.get("falls_last_12_months") else -0.02, ShapDirection.INCREASES_RISK if feature_vector.get("falls_last_12_months") else ShapDirection.DECREASES_RISK),
            ("tug_seconds", feature_vector.get("tug_seconds"), 0.1 if (feature_vector.get("tug_seconds") or 0) >= 20 else -0.01, ShapDirection.INCREASES_RISK if (feature_vector.get("tug_seconds") or 0) >= 20 else ShapDirection.DECREASES_RISK),
            ("vitamin_d", feature_vector.get("vitamin_d"), 0.08 if feature_vector.get("vitamin_d") is not None and float(feature_vector["vitamin_d"]) < 20 else -0.01, ShapDirection.INCREASES_RISK if feature_vector.get("vitamin_d") is not None and float(feature_vector["vitamin_d"]) < 20 else ShapDirection.DECREASES_RISK),
            ("egfr", feature_vector.get("egfr"), 0.06 if feature_vector.get("egfr") is not None and float(feature_vector["egfr"]) < 60 else -0.01, ShapDirection.INCREASES_RISK if feature_vector.get("egfr") is not None and float(feature_vector["egfr"]) < 60 else ShapDirection.DECREASES_RISK),
        ]

        if feature_vector.get("is_postmenopause"):
            candidates.append(
                (
                    "postmenopause_duration",
                    feature_vector.get("postmenopause_duration"),
                    min(0.16, 0.02 * float(feature_vector.get("postmenopause_duration") or 0)),
                    ShapDirection.INCREASES_RISK,
                )
            )

        top = sorted(candidates, key=lambda item: abs(item[2]), reverse=True)[:3]
        return [
            ShapFactor(
                feature_key=key,
                label=FEATURE_LABELS[key][lang],
                value=value,
                shap_value=round(shap_value, 4),
                direction=direction,
            )
            for key, value, shap_value, direction in top
        ]

    def predict_from_screening(self, screening: ScreeningInput) -> tuple[float, list[ShapFactor], dict[str, Any]]:
        features = build_features(screening)
        vector = self.build_feature_vector(features)
        probability = self.predict_proba(vector)
        return probability, self.explain(vector, "ru"), vector

    @staticmethod
    def _duration_weight(feature_vector: dict[str, Any]) -> float:
        if feature_vector.get("diabetes_duration") == "gt_10":
            return 0.18
        if feature_vector.get("diabetes_duration") == "between_5_10":
            return 0.08
        return -0.02
