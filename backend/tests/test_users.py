from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.routers.users import get_db
import app.main  # Import app after we set up our database

# Use in-memory SQLite for testing with a shared connection pool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.main.app.dependency_overrides[get_db] = override_get_db
client = TestClient(app.main.app)

def test_register_user():
    response = client.post("/api/users/register", json={"nickname": "player1", "password": "pass123"})
    assert response.status_code == 200
    data = response.json()
    assert data["nickname"] == "player1"
    assert "id" in data

def test_register_duplicate_nickname():
    client.post("/api/users/register", json={"nickname": "player2", "password": "pass123"})
    response = client.post("/api/users/register", json={"nickname": "player2", "password": "pass123"})
    assert response.status_code == 400

def test_login_success():
    client.post("/api/users/register", json={"nickname": "player3", "password": "pass123"})
    response = client.post("/api/users/login", json={"nickname": "player3", "password": "pass123"})
    assert response.status_code == 200
    assert response.cookies.get("session_token") is not None
    data = response.json()
    assert data["nickname"] == "player3"


def test_login_wrong_password():
    client.post("/api/users/register", json={"nickname": "player4", "password": "pass123"})
    response = client.post("/api/users/login", json={"nickname": "player4", "password": "wrongpass"})
    assert response.status_code == 401


def login_and_get_cookie(nickname, password):
    response = client.post("/api/users/login", json={"nickname": nickname, "password": password})
    return response.cookies.get("session_token")


def test_current_user_endpoint():
    client.post("/api/users/register", json={"nickname": "player8", "password": "pass123"})
    cookie = login_and_get_cookie("player8", "pass123")
    response = client.get("/api/users/me", cookies={"session_token": cookie})
    assert response.status_code == 200
    assert response.json()["nickname"] == "player8"


def test_logout_clears_cookie():
    client.post("/api/users/register", json={"nickname": "player9", "password": "pass123"})
    cookie = login_and_get_cookie("player9", "pass123")
    response = client.post("/api/users/logout", cookies={"session_token": cookie})
    assert response.status_code == 200
    assert response.cookies.get("session_token") is None


def test_list_users():
    client.post("/api/users/register", json={"nickname": "player10", "password": "pass123"})
    cookie = login_and_get_cookie("player10", "pass123")
    response = client.get("/api/users/", cookies={"session_token": cookie})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_user():
    reg_response = client.post("/api/users/register", json={"nickname": "player5", "password": "pass123"})
    user_id = reg_response.json()["id"]
    cookie = login_and_get_cookie("player5", "pass123")
    response = client.get(f"/api/users/{user_id}", cookies={"session_token": cookie})
    assert response.status_code == 200
    assert response.json()["nickname"] == "player5"


def test_update_user():
    reg_response = client.post("/api/users/register", json={"nickname": "player6", "password": "pass123"})
    user_id = reg_response.json()["id"]
    cookie = login_and_get_cookie("player6", "pass123")
    response = client.put(
        f"/api/users/{user_id}",
        json={"nickname": "newplayer6", "password": "newpass123"},
        cookies={"session_token": cookie},
    )
    assert response.status_code == 200
    assert response.json()["nickname"] == "newplayer6"


def test_delete_user():
    reg_response = client.post("/api/users/register", json={"nickname": "player7", "password": "pass123"})
    user_id = reg_response.json()["id"]
    cookie = login_and_get_cookie("player7", "pass123")
    response = client.delete(f"/api/users/{user_id}", cookies={"session_token": cookie})
    assert response.status_code == 200
    
    # Verify user is deleted
    response = client.get(f"/api/users/{user_id}", cookies={"session_token": cookie})
    assert response.status_code == 401
