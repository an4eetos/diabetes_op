from typing import Any

from app.domain.enums import DiabetesDuration, MenopauseStatus, Sex
from app.schemas.screening import ScreeningInput


def build_features(screening: ScreeningInput) -> dict[str, Any]:
    features = screening.model_dump(mode="json")
    features["bmi"] = round(screening.weight_kg / ((screening.height_cm / 100) ** 2), 1)
    features["age_outside_training_range"] = screening.age_warning
    features["sex_female"] = screening.sex == Sex.FEMALE
    features["sex_male"] = screening.sex == Sex.MALE
    features["diabetes_duration_lt_5"] = screening.diabetes_duration == DiabetesDuration.LT_5
    features["diabetes_duration_5_10"] = screening.diabetes_duration == DiabetesDuration.BETWEEN_5_10
    features["diabetes_duration_gt_10"] = screening.diabetes_duration == DiabetesDuration.GT_10

    if screening.sex != Sex.FEMALE:
        features["menopause_status"] = None
        features["menopause_onset_age"] = None
        features["postmenopause_duration"] = None
        features["is_postmenopause"] = False
    else:
        features["is_postmenopause"] = screening.menopause_status == MenopauseStatus.POSTMENOPAUSE

    if screening.menopause_status != MenopauseStatus.POSTMENOPAUSE:
        features["menopause_onset_age"] = None
        features["postmenopause_duration"] = None

    return features
