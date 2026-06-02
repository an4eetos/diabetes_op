from app.domain.enums import PredictionRiskCategory
from app.services.prediction_service import risk_category_from_probability


def test_prediction_threshold_boundaries():
    assert risk_category_from_probability(0) == PredictionRiskCategory.LOW
    assert risk_category_from_probability(0.1999) == PredictionRiskCategory.LOW
    assert risk_category_from_probability(0.20) == PredictionRiskCategory.BORDERLINE
    assert risk_category_from_probability(0.6000) == PredictionRiskCategory.BORDERLINE
    assert risk_category_from_probability(0.6001) == PredictionRiskCategory.HIGH
    assert risk_category_from_probability(1.0) == PredictionRiskCategory.HIGH
