from pathlib import Path

from app.domain.enums import RiskCategory, Sex
from app.risk_engine import RiskEngine, RiskInputData


RULES_PATH = Path(__file__).resolve().parents[1] / "app" / "risk_engine" / "rules.json"


def test_low_risk_placeholder_score():
    engine = RiskEngine(RULES_PATH)
    result = engine.calculate(
        RiskInputData(
            age=45,
            sex=Sex.FEMALE,
            diabetes_duration_years=3,
            hba1c_percent=6.8,
        )
    )

    assert result.total_risk == 0
    assert result.vascular_risk == 0
    assert result.skeletal_risk == 0
    assert result.category == RiskCategory.LOW
    assert "not been clinically validated" in result.algorithm_disclaimer


def test_high_risk_score_is_bounded_and_categorized():
    engine = RiskEngine(RULES_PATH)
    result = engine.calculate(
        RiskInputData(
            age=72,
            sex=Sex.MALE,
            diabetes_duration_years=18,
            hba1c_percent=9.1,
            previous_low_energy_fractures=True,
            previous_myocardial_infarction=True,
            previous_stroke=True,
            bmi=31,
            egfr=45,
        )
    )

    assert result.vascular_risk == 100
    assert result.skeletal_risk == 85
    assert result.total_risk == 92
    assert result.category == RiskCategory.HIGH

