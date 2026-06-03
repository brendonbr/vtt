from app.services.user._core import *


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
