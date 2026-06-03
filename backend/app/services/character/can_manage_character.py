from app.services.character._core import *


def can_manage_character(character: CharacterModel, user_id: int, db: Session) -> bool:
    if character.owner_id == user_id:
        return True
    if character.campaign_id is None:
        return False

    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == character.campaign_id).first()
    return bool(campaign and campaign.owner_id == user_id)
