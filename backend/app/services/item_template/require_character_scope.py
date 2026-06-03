from app.services.item_template._core import *


def require_character_scope(character_id: Optional[int], campaign_id: Optional[int], user: User, db: Session):
    if character_id is None:
        return None
    character = db.query(Dnd5e2014CharacterSheet).filter(Dnd5e2014CharacterSheet.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character sheet not found")
    if campaign_id is not None and character.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Character does not belong to this campaign")
    if character.owner_id == user.id:
        return character
    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == character.campaign_id).first()
    if not campaign or campaign.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Character sheet access denied")
    return character
