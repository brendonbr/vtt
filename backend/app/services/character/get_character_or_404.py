from app.services.character._core import *


def get_character_or_404(character_id: int, db: Session, campaign_id: Optional[int] = None) -> CharacterModel:
    if campaign_id is not None:
        campaign = get_campaign_or_404(campaign_id, db)
        model = get_character_model_for_campaign(campaign)
        character = (
            db.query(model)
            .filter(
                model.id == character_id,
                model.campaign_id == campaign_id,
            )
            .first()
        )
        if character:
            return character
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character sheet not found")

    for model in CHARACTER_MODELS_BY_SYSTEM.values():
        character = db.query(model).filter(model.id == character_id).first()
        if character:
            return character
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character sheet not found")
