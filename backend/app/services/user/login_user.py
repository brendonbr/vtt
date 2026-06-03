from app.services.user._core import *


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
