def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "new@example.com",
            "password": "password123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "dup@example.com",
            "password": "password123",
            "full_name": "User One",
        },
    )
    response = client.post(
        "/api/auth/register",
        json={
            "email": "dup@example.com",
            "password": "password456",
            "full_name": "User Two",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "short@example.com",
            "password": "short",
            "full_name": "Short Pass",
        },
    )
    assert response.status_code == 400


def test_login(client):
    # First register
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "password123",
            "full_name": "Login User",
        },
    )
    # Then login
    response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "password123",
            "full_name": "Wrong Pass",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["has_subscription"] is False


def test_get_me_no_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403
