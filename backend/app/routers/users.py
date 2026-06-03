from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    session_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    return user_service.get_user_from_session(session_token, db)

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with nickname and password.
    """
    return user_service.register_user(user, db)

@router.post("/login", response_model=UserResponse)
async def login(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    """
    Login with nickname and password and create a session cookie.
    """
    return user_service.login_user(user, response, db)

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
    return user_service.list_users(db)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: User = Depends(get_current_user)):
    """
    Get a specific user by ID. Users can only retrieve their own profile.
    """
    return user_service.get_user_profile(user_id, current_user)

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
    return user_service.update_user(user_id, user_data, current_user, db)

@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete the authenticated user's account.
    """
    return user_service.delete_user(user_id, current_user, db)
