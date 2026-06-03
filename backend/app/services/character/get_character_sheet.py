from app.services.character._core import *


def get_character_sheet(character_id: int, campaign_id: Optional[int], current_user: User, db: Session) -> CharacterModel:
    character = get_character_or_404(character_id, db, campaign_id)
    require_character_access(character, current_user.id, db)
    return character
