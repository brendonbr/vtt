from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dice_roll_post():
    response = client.post("/api/dice/roll", json={"dice_type": "d20", "num_rolls": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["dice_type"] == "d20"
    assert data["num_rolls"] == 1
    assert len(data["rolls"]) == 1
    assert 1 <= data["rolls"][0] <= 20
    assert data["total"] == data["rolls"][0]

def test_dice_roll_multiple():
    response = client.post("/api/dice/roll", json={"dice_type": "d6", "num_rolls": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["dice_type"] == "d6"
    assert data["num_rolls"] == 3
    assert len(data["rolls"]) == 3
    assert all(1 <= roll <= 6 for roll in data["rolls"])

def test_dice_roll_get():
    response = client.get("/api/dice/roll/d20/1")
    assert response.status_code == 200
    data = response.json()
    assert data["dice_type"] == "d20"
    assert 1 <= data["rolls"][0] <= 20

def test_dice_roll_invalid_type():
    response = client.post("/api/dice/roll", json={"dice_type": "invalid", "num_rolls": 1})
    assert response.status_code == 200
    data = response.json()
    assert "error" in data
