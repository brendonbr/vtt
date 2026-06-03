from app.services.character._core import *


def create_character_sheet(character_data: dict[str, Any], current_user: User, db: Session) -> CharacterModel:
    campaign = require_campaign_if_present(character_data.get("campaign_id"), current_user.id, db)
    model = get_character_model_for_campaign(campaign)
    values = model_values(character_data, model, CREATE_SCHEMAS_BY_MODEL[model])
    if model is Dnd5e2014CharacterSheet:
        validate_dnd5e_2014_equipment(values, db, current_user.id)

    character = model(
        **values,
        owner_id=current_user.id,
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character
