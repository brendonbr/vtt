from app.services.user._core import *


def get_user_profile(user_id: int, current_user: User) -> User:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return current_user
