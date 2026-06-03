from app.services.character._core import *


def require_character_manager(character: CharacterModel, user_id: int, db: Session):
    if not can_manage_character(character, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner or campaign DM can do this")
