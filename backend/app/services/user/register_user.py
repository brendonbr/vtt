from app.services.user._core import *


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
