from app.services.character._core import *


def get_character_model_for_campaign(campaign: Optional[AdventureCampaign]):
    game_system = campaign.game_system if campaign else "Dnd5e 2014"
    model = CHARACTER_MODELS_BY_SYSTEM.get(game_system)
    if not model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported campaign game system")
    return model
