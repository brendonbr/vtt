from app.services.character._core import *


def update_character_sheet(
    character_id: int,
    character_data: dict[str, Any],
    campaign_id: Optional[int],
    current_user: User,
    db: Session,
) -> CharacterModel:
    character = get_character_or_404(character_id, db, campaign_id)
    require_character_manager(character, current_user.id, db)

    updates = model_values(character_data, character.__class__, UPDATE_SCHEMAS_BY_MODEL[character.__class__])
    if "campaign_id" in updates:
        require_campaign_if_present(updates["campaign_id"], current_user.id, db)
    if character.__class__ is Dnd5e2014CharacterSheet:
        current_values = {column.name: getattr(character, column.name) for column in character.__table__.columns}
        current_values.update(updates)
        validate_dnd5e_2014_equipment(current_values, db, current_user.id)

    for field, value in updates.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)
    return character
