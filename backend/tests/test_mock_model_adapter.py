from app.ml.feature_builder import build_features
from app.ml.mock_model_adapter import MockModelAdapter
from app.schemas.screening import ScreeningInput


def screening_input(**overrides):
    payload = {
        "sex": "female",
        "age": 64,
        "height_cm": 164,
        "weight_kg": 74,
        "diabetes_duration": "gt_10",
        "hba1c": 8.1,
        "has_polyneuropathy": True,
        "has_nephropathy": False,
        "menopause_status": "postmenopause",
        "menopause_onset_age": 49,
        "vitamin_d": 18,
        "falls_last_12_months": True,
        "tug_seconds": 22.0,
    }
    payload.update(overrides)
    return ScreeningInput.model_validate(payload)


def test_mock_model_returns_deterministic_probability():
    adapter = MockModelAdapter()
    vector = adapter.build_feature_vector(build_features(screening_input()))

    first = adapter.predict_proba(vector)
    second = adapter.predict_proba(vector)

    assert first == second
    assert first == 0.97


def test_mock_shap_returns_top_three_shape():
    adapter = MockModelAdapter()
    vector = adapter.build_feature_vector(build_features(screening_input()))

    factors = adapter.explain(vector, "en")

    assert len(factors) == 3
    for factor in factors:
        assert factor.feature_key
        assert factor.label
        assert factor.value is not None
        assert isinstance(factor.shap_value, float)
        assert factor.direction.value in {"increases_risk", "decreases_risk"}
