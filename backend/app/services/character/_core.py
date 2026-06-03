from typing import Any, Optional

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.data.dnd5e_2014_items import ITEM_TEMPLATES
from app.models.campaign import AdventureCampaign
from app.models.character import Dnd5e2014CharacterSheet, Tormenta20CharacterSheet
from app.models.item_template import EQUIPMENT_SLOTS, ItemTemplate
from app.models.user import User
from app.schemas.character import (
    Dnd5e2014CharacterSheetCreate,
    Dnd5e2014CharacterSheetResponse,
    Dnd5e2014CharacterSheetUpdate,
    Tormenta20CharacterSheetCreate,
    Tormenta20CharacterSheetResponse,
    Tormenta20CharacterSheetUpdate,
)
from app.services.campaign.service import get_campaign_or_404, require_campaign_access, user_can_access

LEGACY_WEAPON_SLOTS = {"mainHand", "offHand"}
LEGACY_GEAR_SLOTS = {"carried"}

CharacterModel = Dnd5e2014CharacterSheet | Tormenta20CharacterSheet
CharacterResponse = Dnd5e2014CharacterSheetResponse | Tormenta20CharacterSheetResponse

CHARACTER_MODELS_BY_SYSTEM = {
    "Dnd5e 2014": Dnd5e2014CharacterSheet,
    "Tormenta20": Tormenta20CharacterSheet,
}
CREATE_SCHEMAS_BY_MODEL = {
    Dnd5e2014CharacterSheet: Dnd5e2014CharacterSheetCreate,
    Tormenta20CharacterSheet: Tormenta20CharacterSheetCreate,
}
UPDATE_SCHEMAS_BY_MODEL = {
    Dnd5e2014CharacterSheet: Dnd5e2014CharacterSheetUpdate,
    Tormenta20CharacterSheet: Tormenta20CharacterSheetUpdate,
}


def get_character_model_for_campaign(campaign: Optional[AdventureCampaign]):
    game_system = campaign.game_system if campaign else "Dnd5e 2014"
    model = CHARACTER_MODELS_BY_SYSTEM.get(game_system)
    if not model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported campaign game system")
    return model


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


def can_access_character(character: CharacterModel, user_id: int, db: Session) -> bool:
    if character.owner_id == user_id:
        return True
    if character.campaign_id is None:
        return False

    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == character.campaign_id).first()
    return bool(campaign and user_can_access(campaign, user_id))


def can_manage_character(character: CharacterModel, user_id: int, db: Session) -> bool:
    if character.owner_id == user_id:
        return True
    if character.campaign_id is None:
        return False

    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == character.campaign_id).first()
    return bool(campaign and campaign.owner_id == user_id)


def require_character_access(character: CharacterModel, user_id: int, db: Session):
    if not can_access_character(character, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Character sheet access denied")


def require_character_manager(character: CharacterModel, user_id: int, db: Session):
    if not can_manage_character(character, user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner or campaign DM can do this")


def require_campaign_if_present(campaign_id: Optional[int], user_id: int, db: Session):
    if campaign_id is None:
        return None
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, user_id)
    return campaign


def model_values(character_data: dict[str, Any], model, schema) -> dict[str, Any]:
    try:
        validated_data = schema.model_validate(character_data).model_dump(exclude_unset=True)
    except ValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error.errors()) from error
    model_fields = {column.name for column in model.__table__.columns}
    return {field: value for field, value in validated_data.items() if field in model_fields}


def normalize_equipment_slot(slot: Optional[str]) -> Optional[str]:
    if slot in LEGACY_WEAPON_SLOTS:
        return "weapon"
    if slot in LEGACY_GEAR_SLOTS:
        return "gear"
    return slot


def resolve_item_template(template_id: str, db: Session, user_id: int, campaign_id: Optional[int], character_id: Optional[int] = None):
    if template_id in ITEM_TEMPLATES:
        return ITEM_TEMPLATES[template_id]
    if not isinstance(template_id, str) or not template_id.startswith("custom-"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown item template: {template_id}")
    try:
        numeric_id = int(template_id.removeprefix("custom-"))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown item template: {template_id}") from error
    custom = db.query(ItemTemplate).filter(ItemTemplate.id == numeric_id).first()
    if not custom:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown item template: {template_id}")
    if custom.character_id is not None and custom.character_id != character_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Custom item belongs to a different character sheet")
    if custom.owner_id != user_id:
        if custom.campaign_id is None or custom.campaign_id != campaign_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item template access denied")
        campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == custom.campaign_id).first()
        if not campaign or not user_can_access(campaign, user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item template access denied")
    if custom.campaign_id is not None and custom.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Campaign item cannot be equipped outside its campaign")
    default_slots_by_type = {
        "weapon": "weapon",
        "armor": "armor",
        "shield": "shield",
        "ammunition": "ammunition",
        "consumable": "consumable",
        "gear": "gear",
        "magic": "gear",
        "magicalItem": "gear",
        "accessory": "gear",
    }
    return {
        "type": custom.type,
        "slot": normalize_equipment_slot((custom.armor_class or {}).get("slot")) or default_slots_by_type.get(custom.type, "weapon"),
        "attunement": custom.requires_attunement == "true",
        "properties": custom.properties or [],
        "strengthRequirement": (custom.armor_class or {}).get("strengthRequirement", 0),
    }


def validate_dnd5e_2014_equipment(values: dict[str, Any], db: Session, user_id: int):
    equipment = values.get("equipment")
    if equipment is None:
        return
    if not isinstance(equipment, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Equipment must be a list")

    attuned_count = 0
    strength = int(values.get("strength") or 10)
    campaign_id = values.get("campaign_id")
    character_id = values.get("id")

    for item in equipment:
        if not isinstance(item, dict):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Equipment items must be objects")

        template_id = item.get("itemTemplateId")
        template = resolve_item_template(template_id, db, user_id, campaign_id, character_id)

        quantity = int(item.get("quantity") or 0)
        if quantity < 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Equipment quantity cannot be negative")

        if item.get("attuned"):
            if not template.get("attunement"):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{template_id} does not support attunement")
            attuned_count += 1

        slot = normalize_equipment_slot(item.get("slot") or template.get("slot"))
        if slot not in EQUIPMENT_SLOTS:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid equipped slot")

        if item.get("equipped"):
            strength_requirement = int(template.get("strengthRequirement") or 0)
            if strength_requirement and strength < strength_requirement:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"{template_id} requires Strength {strength_requirement}",
                )

    if attuned_count > 3:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Attunement limit exceeded")


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


def get_character_sheet(character_id: int, campaign_id: Optional[int], current_user: User, db: Session) -> CharacterModel:
    character = get_character_or_404(character_id, db, campaign_id)
    require_character_access(character, current_user.id, db)
    return character


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


def delete_character_sheet(character_id: int, campaign_id: Optional[int], current_user: User, db: Session) -> dict[str, str]:
    character = get_character_or_404(character_id, db, campaign_id)
    require_character_manager(character, current_user.id, db)

    if character.__class__ is Dnd5e2014CharacterSheet:
        db.query(ItemTemplate).filter(ItemTemplate.character_id == character.id).delete()
    db.delete(character)
    db.commit()
    return {"message": "Character sheet deleted successfully"}
