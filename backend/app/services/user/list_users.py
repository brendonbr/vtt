from app.services.user._core import *


def list_users(db: Session) -> list[User]:
    return db.query(User).all()
