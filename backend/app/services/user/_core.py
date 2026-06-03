import base64
import hashlib
import hmac
import secrets
import time
from typing import Optional

from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from config import SECRET_KEY, SESSION_EXPIRE_SECONDS


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


def get_user_from_session(session_token: Optional[str], db: Session) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user_id = verify_session_token(session_token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def register_user(user_data: UserCreate, db: Session) -> User:
    existing_user = db.query(User).filter(User.nickname == user_data.nickname).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nickname already exists")

    if len(user_data.password) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 4 characters")

    user = User(nickname=user_data.nickname)
    user.set_password(user_data.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(user_data: UserCreate, response: Response, db: Session) -> User:
    user = db.query(User).filter(User.nickname == user_data.nickname).first()
    if not user or not user.verify_password(user_data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid nickname or password")

    response.set_cookie(
        key="session_token",
        value=create_session_token(user.id),
        httponly=True,
        samesite="lax",
        max_age=SESSION_EXPIRE_SECONDS,
        path="/",
    )
    return user


def list_users(db: Session) -> list[User]:
    return db.query(User).all()


def get_user_profile(user_id: int, current_user: User) -> User:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return current_user


def update_user(user_id: int, user_data: UserCreate, current_user: User, db: Session) -> User:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    existing = db.query(User).filter(User.nickname == user_data.nickname, User.id != user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nickname already exists")

    current_user.nickname = user_data.nickname
    if user_data.password:
        current_user.set_password(user_data.password)

    db.commit()
    db.refresh(current_user)
    return current_user


def delete_user(user_id: int, current_user: User, db: Session) -> dict[str, str]:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(current_user)
    db.commit()
    return {"message": "User deleted successfully"}
