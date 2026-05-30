import os

# Configuration settings
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://0.0.0.0:5173"]
DEBUG = True
SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-secret-key")
SESSION_EXPIRE_SECONDS = int(os.environ.get("SESSION_EXPIRE_SECONDS", "3600"))
