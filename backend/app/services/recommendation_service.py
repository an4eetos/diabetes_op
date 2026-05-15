from app.domain.enums import RiskCategory
from app.schemas.risk import RiskResult


class RecommendationService:
    disclaimer_code = "workflow_disclaimer"

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
