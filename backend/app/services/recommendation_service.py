import json
from pathlib import Path

from app.domain.enums import PredictionRiskCategory, RiskCategory
from app.schemas.risk import RiskResult


class RecommendationService:
    disclaimer_code = "workflow_disclaimer"
    prediction_codes = {
        PredictionRiskCategory.LOW: "planned_observation",
        PredictionRiskCategory.BORDERLINE: "attention_group_additional_tests",
        PredictionRiskCategory.HIGH: "high_risk_specialist_referral",
    }

    def generate(self, risk: RiskResult) -> list[str]:
        if risk.category == RiskCategory.LOW:
            return [
                "standard_diabetes_control",
                "reassess_next_visit",
                self.disclaimer_code,
            ]
        if risk.category == RiskCategory.MEDIUM:
            return [
                "additional_exams",
                "optimize_diabetes_management",
                self.disclaimer_code,
            ]
        return [
            "urgent_specialist_referral",
            "preventive_measures",
            self.disclaimer_code,
        ]

    def code_for_prediction_category(self, category: PredictionRiskCategory) -> str:
        return self.prediction_codes[category]

    def localized_text(self, code: str, language: str) -> str:
        lang = language if language in {"ru", "kk", "en"} else "ru"
        path = Path(__file__).resolve().parents[1] / "localization" / f"recommendations.{lang}.json"
        with path.open(encoding="utf-8") as recommendations_file:
            translations = json.load(recommendations_file)
        return translations.get(code, code)
