from app.services.user._core import *


def delete_user(user_id: int, current_user: User, db: Session) -> dict[str, str]:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(current_user)
    db.commit()
    return {"message": "User deleted successfully"}
