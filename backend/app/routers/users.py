import base64
import hashlib
import hmac
import secrets
import time
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, UserCreate, UserResponse
from config import SECRET_KEY, SESSION_EXPIRE_SECONDS

router = APIRouter(prefix="/api/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_session_token(user_id: int) -> str:
    expires_at = int(time.time()) + SESSION_EXPIRE_SECONDS
    payload = f"{user_id}:{expires_at}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = f"{payload}:{signature}"
    return base64.urlsafe_b64encode(token.encode()).decode()


def verify_session_token(token: str) -> Optional[int]:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        user_id_str, expires_at_str, signature = raw.split(":")
        payload = f"{user_id_str}:{expires_at_str}"
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(expected, signature):
            return None
        if int(expires_at_str) < int(time.time()):
            return None
        return int(user_id_str)
    except Exception:
        return None


def get_current_user(
    session_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user_id = verify_session_token(session_token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with nickname and password.
    """
    existing_user = db.query(User).filter(User.nickname == user.nickname).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Nickname already exists")
    
    if len(user.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    
    new_user = User(nickname=user.nickname)
    new_user.set_password(user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
async def login(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    """
    Login with nickname and password and create a session cookie.
    """
    db_user = db.query(User).filter(User.nickname == user.nickname).first()
    if not db_user or not db_user.verify_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid nickname or password")

    token = create_session_token(db_user.id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_EXPIRE_SECONDS,
        path="/",
    )
    return db_user

@router.post("/logout")
async def logout(response: Response):
    """
    Clear the current session cookie.
    """
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_me(current_user: User = Depends(get_current_user)):
    """
    Get the currently authenticated user.
    """
    return current_user

@router.get("/", response_model=list[UserResponse])
async def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    List all users (requires authentication).
    """
    users = db.query(User).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: User = Depends(get_current_user)):
    """
    Get a specific user by ID. Users can only retrieve their own profile.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the authenticated user's nickname and/or password.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = db.query(User).filter(User.nickname == user_data.nickname, User.id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nickname already exists")
    
    current_user.nickname = user_data.nickname
    if user_data.password:
        current_user.set_password(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete the authenticated user's account.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(current_user)
    db.commit()
    return {"message": "User deleted successfully"}