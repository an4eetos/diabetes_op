from app.domain.enums import PredictionRiskCategory
from app.services.recommendation_service import RecommendationService


def test_prediction_recommendation_codes_by_category():
    service = RecommendationService()

    assert service.code_for_prediction_category(PredictionRiskCategory.LOW) == "planned_observation"
    assert service.code_for_prediction_category(PredictionRiskCategory.BORDERLINE) == "attention_group_additional_tests"
    assert service.code_for_prediction_category(PredictionRiskCategory.HIGH) == "high_risk_specialist_referral"


def test_recommendations_are_localized():
    service = RecommendationService()

    assert "Плановое" in service.localized_text("planned_observation", "ru")
    assert "Жоспарлы" in service.localized_text("planned_observation", "kk")
    assert "Planned" in service.localized_text("planned_observation", "en")
