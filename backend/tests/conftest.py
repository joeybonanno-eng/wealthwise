import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a user and return auth headers."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def subscribed_headers(client, db):
    """Register a user with an active subscription and return auth headers."""
    from app.models.subscription import Subscription

    response = client.post(
        "/api/auth/register",
        json={
            "email": "subscriber@example.com",
            "password": "testpassword123",
            "full_name": "Subscriber User",
        },
    )
    token = response.json()["access_token"]

    # Get user ID from token
    from app.services.auth_service import decode_access_token
    payload = decode_access_token(token)
    user_id = int(payload["sub"])

    # Create active subscription
    sub = Subscription(user_id=user_id, status="active")
    db.add(sub)
    db.commit()

    return {"Authorization": f"Bearer {token}"}
