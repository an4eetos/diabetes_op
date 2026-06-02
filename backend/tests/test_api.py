def auth_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def base_screening_data(**overrides):
    payload = {
        "sex": "female",
        "age": 62,
        "height_cm": 165,
        "weight_kg": 72,
        "diabetes_duration": "between_5_10",
        "hba1c": 7.2,
        "has_polyneuropathy": False,
        "has_retinopathy": False,
        "has_nephropathy": False,
        "menopause_status": "postmenopause",
        "menopause_onset_age": 50,
        "vitamin_d": 18.5,
        "falls_last_12_months": True,
        "tug_seconds": 21.0,
        "hand_grip_kg": 24.5,
    }
    payload.update(overrides)
    return payload


def test_login_and_create_anonymized_patient(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/patients",
        headers=headers,
        json={"patient_external_id": "OSTEO-001"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["patient_external_id"] == "OSTEO-001"
    assert body["first_name"] is None
    assert body["last_name"] is None


def test_create_full_patient_profile(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/patients",
        headers=headers,
        json={
            "medical_record_number": "MRN-001",
            "first_name": "Aida",
            "last_name": "Karimova",
            "sex": "female",
            "menopause_status": "yes",
            "phone": "+77000000000",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["patient_external_id"] is None
    assert body["medical_record_number"] == "MRN-001"
    assert body["first_name"] == "Aida"
    assert body["last_name"] == "Karimova"
    assert body["sex"] == "female"
    assert body["menopause_status"] == "yes"

    patients = client.get("/api/v1/patients", headers=headers)
    assert patients.status_code == 200
    assert [patient["medical_record_number"] for patient in patients.json()] == ["MRN-001"]


def test_health_and_model_status(client):
    health = client.get("/api/v1/health")
    model = client.get("/api/v1/model/status")

    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    assert health.json()["model"]["model_type"] == "mock"
    assert model.status_code == 200
    assert model.json()["development_mode"] is True


def test_create_prediction_response_shape_and_localized_recommendation(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/predictions",
        headers=headers,
        json={
            "patient_id": "OSTEO-PRED-001",
            "screening_data": base_screening_data(),
            "language": "en",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["prediction_id"]
    assert body["screening_id"]
    assert 0 <= body["probability"] <= 1
    assert body["probability_percent"] == round(body["probability"] * 100, 1)
    assert body["risk_category"] in {"low", "borderline", "high"}
    assert len(body["shap_factors"]) == 3
    assert set(body["shap_factors"][0]) == {"feature_key", "label", "value", "shap_value", "direction"}
    assert body["recommendation_code"] in {
        "planned_observation",
        "attention_group_additional_tests",
        "high_risk_specialist_referral",
    }
    assert body["recommendation_text"]
    assert body["model_type"] == "mock"


def test_prediction_api_rejects_negative_values(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/predictions",
        headers=headers,
        json={
            "patient_id": "OSTEO-NEGATIVE-001",
            "screening_data": base_screening_data(vitamin_d=-1),
            "language": "ru",
        },
    )

    assert response.status_code == 422


def test_male_prediction_excludes_menopause_fields(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/predictions",
        headers=headers,
        json={
            "patient_id": "OSTEO-MALE-001",
            "screening_data": base_screening_data(
                sex="male",
                menopause_status="postmenopause",
                menopause_onset_age=50,
                falls_last_12_months=False,
                tug_seconds=None,
            ),
            "language": "ru",
        },
    )
    assert response.status_code == 201
    screening_id = response.json()["screening_id"]

    screening = client.get(f"/api/v1/screenings/{screening_id}", headers=headers)
    assert screening.status_code == 200
    body = screening.json()
    assert body["sex"] == "male"
    assert body["menopause_status"] is None
    assert body["menopause_onset_age"] is None
    assert body["postmenopause_duration"] is None


def test_postmenopause_onset_cannot_exceed_age(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/predictions",
        headers=headers,
        json={
            "patient_id": "OSTEO-INVALID-001",
            "screening_data": base_screening_data(age=45, menopause_onset_age=50),
            "language": "ru",
        },
    )

    assert response.status_code == 422


def test_update_my_language_preference(client):
    headers = auth_headers(client)
    response = client.patch(
        "/api/v1/auth/me/preferences",
        headers=headers,
        json={"preferred_language": "kk"},
    )

    assert response.status_code == 200
    assert response.json()["preferred_language"] == "kk"
