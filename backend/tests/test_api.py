def auth_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_and_create_patient(client):
    headers = auth_headers(client)
    response = client.post(
        "/api/v1/patients",
        headers=headers,
        json={
            "medical_record_number": "MRN-001",
            "first_name": "Aida",
            "last_name": "Karimova",
            "sex": "female",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["medical_record_number"] == "MRN-001"
    assert body["first_name"] == "Aida"


def test_create_screening_calculates_risk(client):
    headers = auth_headers(client)
    patient_response = client.post(
        "/api/v1/patients",
        headers=headers,
        json={
            "medical_record_number": "MRN-002",
            "first_name": "Serik",
            "last_name": "Omarov",
            "sex": "male",
        },
    )
    patient_id = patient_response.json()["id"]

    response = client.post(
        f"/api/v1/screenings/patients/{patient_id}",
        headers=headers,
        json={
            "age": 72,
            "sex": "male",
            "diabetes_duration_years": 18,
            "hba1c_percent": 9.1,
            "previous_low_energy_fractures": True,
            "previous_myocardial_infarction": True,
            "previous_stroke": True,
            "bmi": 31,
            "egfr": 45,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["risk_category"] == "high"
    assert body["total_risk"] == 92
    assert body["algorithm_version"] == "mvp-placeholder-v1"
    assert body["recommendation_items"] == [
        "urgent_specialist_referral",
        "preventive_measures",
        "workflow_disclaimer",
    ]


def test_update_my_language_preference(client):
    headers = auth_headers(client)
    response = client.patch(
        "/api/v1/auth/me/preferences",
        headers=headers,
        json={"preferred_language": "kk"},
    )

    assert response.status_code == 200
    assert response.json()["preferred_language"] == "kk"
