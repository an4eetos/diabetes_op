import pytest
from pydantic import ValidationError

from app.ml.feature_builder import build_features
from app.schemas.screening import ScreeningInput


def screening_input(**overrides):
    payload = {
        "sex": "female",
        "age": 64,
        "height_cm": 164,
        "weight_kg": 74,
        "diabetes_duration": "gt_10",
        "hba1c": 8.1,
        "menopause_status": "postmenopause",
        "menopause_onset_age": 49,
    }
    payload.update(overrides)
    return ScreeningInput.model_validate(payload)


def test_feature_builder_encodes_categories_and_derivatives():
    data = screening_input()
    features = build_features(data)

    assert features["bmi"] == 27.5
    assert features["diabetes_duration_gt_10"] is True
    assert features["sex_female"] is True
    assert features["is_postmenopause"] is True
    assert features["postmenopause_duration"] == 15


def test_screening_input_calculates_bmi_and_postmenopause_duration():
    data = screening_input(age=65, height_cm=170, weight_kg=68, menopause_onset_age=51)

    assert data.bmi == 23.5
    assert data.postmenopause_duration == 14


def test_male_input_excludes_hidden_menopause_data():
    data = screening_input(sex="male", menopause_status="postmenopause", menopause_onset_age=50)
    features = build_features(data)

    assert data.menopause_status is None
    assert data.menopause_onset_age is None
    assert data.postmenopause_duration is None
    assert features["sex_male"] is True
    assert features["is_postmenopause"] is False


def test_postmenopause_onset_after_age_is_invalid():
    with pytest.raises(ValidationError):
        screening_input(age=45, menopause_onset_age=50)


def test_female_requires_menopause_status():
    with pytest.raises(ValidationError):
        screening_input(menopause_status=None, menopause_onset_age=None)


def test_postmenopause_requires_onset_age():
    with pytest.raises(ValidationError):
        screening_input(menopause_status="postmenopause", menopause_onset_age=None)


def test_negative_optional_values_are_invalid():
    negative_fields = [
        "vitamin_d",
        "pth",
        "alkaline_phosphatase",
        "total_calcium",
        "egfr",
        "tug_seconds",
        "hand_grip_kg",
    ]

    for field in negative_fields:
        with pytest.raises(ValidationError):
            screening_input(**{field: -1})
