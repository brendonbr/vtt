from app.services.character._core import *


def delete_character_sheet(character_id: int, campaign_id: Optional[int], current_user: User, db: Session) -> dict[str, str]:
    character = get_character_or_404(character_id, db, campaign_id)
    require_character_manager(character, current_user.id, db)

    if character.__class__ is Dnd5e2014CharacterSheet:
        db.query(ItemTemplate).filter(ItemTemplate.character_id == character.id).delete()
    db.delete(character)
    db.commit()
    return {"message": "Character sheet deleted successfully"}
