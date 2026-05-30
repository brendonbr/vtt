from fastapi.testclient import TestClient
from app.main import app
import os

client = TestClient(app)

def test_list_maps_empty():
    response = client.get("/api/maps/")
    assert response.status_code == 200
    assert response.json() == []

def test_upload_map():
    # Create a test image file
    test_file_path = "test_image.png"
    with open(test_file_path, "wb") as f:
        f.write(b"fake png data")
    
    with open(test_file_path, "rb") as f:
        response = client.post("/api/maps/upload", files={"file": ("test.png", f, "image/png")})
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.png"
    
    # Clean up
    os.remove(test_file_path)
    if os.path.exists("images/test.png"):
        os.remove("images/test.png")

def test_get_map():
    # First upload
    test_file_path = "test_image.png"
    with open(test_file_path, "wb") as f:
        f.write(b"fake png data")
    
    with open(test_file_path, "rb") as f:
        client.post("/api/maps/upload", files={"file": ("test.png", f, "image/png")})
    
    # Then get
    response = client.get("/api/maps/test.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/*"
    
    # Clean up
    os.remove(test_file_path)
    if os.path.exists("images/test.png"):
        os.remove("images/test.png")

def test_delete_map():
    # First upload
    test_file_path = "test_image.png"
    with open(test_file_path, "wb") as f:
        f.write(b"fake png data")
    
    with open(test_file_path, "rb") as f:
        client.post("/api/maps/upload", files={"file": ("test.png", f, "image/png")})
    
    # Then delete
    response = client.delete("/api/maps/test.png")
    assert response.status_code == 200
    assert response.json() == {"message": "Map deleted successfully"}
    
    # Clean up
    os.remove(test_file_path)