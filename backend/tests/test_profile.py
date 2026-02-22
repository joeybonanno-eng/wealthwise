def test_get_profile_creates_default(client, auth_headers):
    response = client.get("/api/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["age"] is None
    assert data["annual_income"] is None


def test_update_profile(client, auth_headers):
    response = client.put(
        "/api/profile",
        headers=auth_headers,
        json={
            "age": 30,
            "annual_income": 75000.0,
            "monthly_expenses": 3000.0,
            "risk_tolerance": "moderate",
            "investment_goals": "Retirement, house down payment",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["age"] == 30
    assert data["annual_income"] == 75000.0
    assert data["risk_tolerance"] == "moderate"


def test_update_profile_persists(client, auth_headers):
    client.put(
        "/api/profile",
        headers=auth_headers,
        json={"age": 25, "total_savings": 50000.0},
    )
    response = client.get("/api/profile", headers=auth_headers)
    data = response.json()
    assert data["age"] == 25
    assert data["total_savings"] == 50000.0
