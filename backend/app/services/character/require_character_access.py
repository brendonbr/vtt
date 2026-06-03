from app.services.character._core import *


def require_character_access(character: CharacterModel, user_id: int, db: Session):
    if not can_access_character(character, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Character sheet access denied")
