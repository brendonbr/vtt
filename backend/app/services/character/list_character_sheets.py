from app.services.character._core import *


def list_character_sheets(campaign_id: Optional[int], current_user: User, db: Session) -> list[CharacterModel]:
    if campaign_id is not None:
        campaign = get_campaign_or_404(campaign_id, db)
        require_campaign_access(campaign, current_user.id)
        model = get_character_model_for_campaign(campaign)
        return (
            db.query(model)
            .filter(model.campaign_id == campaign_id)
            .order_by(model.name)
            .all()
        )

    characters = []
    for model in CHARACTER_MODELS_BY_SYSTEM.values():
        characters.extend(
            db.query(model)
            .outerjoin(AdventureCampaign, model.campaign_id == AdventureCampaign.id)
            .filter(
                or_(
                    model.owner_id == current_user.id,
                    AdventureCampaign.owner_id == current_user.id,
                )
            )
            .all()
        )
    return sorted(characters, key=lambda character: character.name.lower())
