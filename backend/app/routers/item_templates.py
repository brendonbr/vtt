import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.data.dnd5e_2014_items import ITEM_TEMPLATES
from app.models.campaign import AdventureCampaign
from app.models.character import Dnd5e2014CharacterSheet
from app.models.item_template import (
    DAMAGE_TYPES,
    EQUIPMENT_SLOTS,
    ITEM_TYPES,
    RARITIES,
    ItemTemplate,
    ItemTemplateCreate,
    ItemTemplateResponse,
    ItemTemplateUpdate,
)
from app.models.user import User
from app.routers.campaigns import require_campaign_access, user_can_access
from app.routers.users import get_current_user, get_db

router = APIRouter(prefix="/api/item-templates", tags=["item-templates"])

DICE_PATTERN = re.compile(r"^\d+d\d+$")
DEFENSIVE_ITEM_TYPES = {"armor", "shield"}


def official_template_response(template_id: str, template: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": template_id,
        "source": "official",
        "owner_id": None,
        "campaign_id": None,
        "name": template.get("name") or template_id.replace("-", " ").title(),
        "type": template.get("type", "gear"),
        "description": template.get("description", ""),
        "rarity": template.get("rarity", "Common"),
        "weight": template.get("weight", 0),
        "cost": template.get("cost", ""),
        "image": template.get("image", ""),
        "requires_attunement": bool(template.get("attunement")),
        "damage": template.get("damage") or {},
        "armor_class": template.get("armorClass") or {},
        "properties": template.get("properties") or [],
        "modifiers": template.get("modifiers") or [],
        "effects": template.get("effects") or [],
    }


def custom_template_response(template: ItemTemplate) -> dict[str, Any]:
    return {
        "id": f"custom-{template.id}",
        "source": "custom",
        "owner_id": template.owner_id,
        "campaign_id": template.campaign_id,
        "character_id": template.character_id,
        "name": template.name,
        "type": template.type,
        "description": template.description or "",
        "rarity": template.rarity or "Common",
        "weight": template.weight or 0,
        "cost": template.cost or "",
        "image": template.image or "",
        "requires_attunement": template.requires_attunement == "true",
        "damage": template.damage or {},
        "armor_class": template.armor_class or {},
        "properties": template.properties or [],
        "modifiers": template.modifiers or [],
        "effects": template.effects or [],
    }


def validate_item_statistics(data: dict[str, Any]):
    item_type = data.get("type")
    if item_type is not None and item_type not in ITEM_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid item type")
    rarity = data.get("rarity")
    if rarity is not None and rarity not in RARITIES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid rarity")
    if data.get("weight") is not None and float(data["weight"]) < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Weight cannot be negative")

    damage = data.get("damage") or {}
    dice = damage.get("dice", "")
    if dice and not DICE_PATTERN.match(dice):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid damage dice")
    damage_types = damage.get("types")
    if damage_types is None:
        damage_types = [damage.get("type", "")]
    if not isinstance(damage_types, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid damage type")
    for damage_type in damage_types:
        if damage_type not in DAMAGE_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid damage type")
    if damage.get("bonus") is not None and not isinstance(damage.get("bonus"), int):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid damage bonus")

    armor_class = data.get("armor_class") or {}
    for field in ("base", "shieldBonus", "strengthRequirement"):
        if armor_class.get(field) is not None and int(armor_class.get(field)) < 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid AC value")
    dexterity_limit = armor_class.get("dexterity")
    if dexterity_limit not in (None, "", "none", "full", "max2"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid dexterity limit")

    for modifier in data.get("modifiers") or []:
        if not isinstance(modifier, dict) or "target" not in modifier:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid modifier")
        if modifier.get("slot") and modifier["slot"] not in EQUIPMENT_SLOTS:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid equipped slot")


def clean_item_statistics(values: dict[str, Any]) -> dict[str, Any]:
    cleaned = dict(values)
    item_type = cleaned.get("type")

    damage = cleaned.get("damage")
    if damage:
        damage = dict(damage)
        damage_types = damage.get("types")
        if damage_types is None:
            damage_types = [damage.get("type", "")]
        damage_types = [damage_type for damage_type in damage_types if damage_type]
        if damage_types:
            damage["types"] = damage_types
            damage["type"] = damage_types[0]
        else:
            damage.pop("types", None)
            damage["type"] = ""
        cleaned["damage"] = damage

    if item_type not in DEFENSIVE_ITEM_TYPES:
        cleaned["armor_class"] = {}

    return cleaned


def require_custom_template(template_id: str, db: Session) -> ItemTemplate:
    if not template_id.startswith("custom-"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only custom items can be modified")
    try:
        numeric_id = int(template_id.removeprefix("custom-"))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item template not found") from error
    template = db.query(ItemTemplate).filter(ItemTemplate.id == numeric_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item template not found")
    return template


def can_manage_template(template: ItemTemplate, user: User, db: Session) -> bool:
    if template.owner_id == user.id:
        return True
    if template.campaign_id is None:
        return False
    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first()
    return bool(campaign and campaign.owner_id == user.id)


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


@router.get("/", response_model=list[ItemTemplateResponse])
async def list_item_templates(
    campaign_id: Optional[int] = Query(default=None),
    character_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if campaign_id is not None:
        campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        require_campaign_access(campaign, current_user.id)
    require_character_scope(character_id, campaign_id, current_user, db)

    official = [official_template_response(template_id, template) for template_id, template in ITEM_TEMPLATES.items()]
    filters = [ItemTemplate.owner_id == current_user.id]
    if campaign_id is not None:
        filters.append(ItemTemplate.campaign_id == campaign_id)
    custom_query = db.query(ItemTemplate).filter(or_(*filters))
    custom = [
        custom_template_response(template)
        for template in custom_query.order_by(ItemTemplate.name).all()
        if template.character_id == character_id
        and (
            template.campaign_id is None
            or template.owner_id == current_user.id
            or (
                (campaign := db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first())
                and user_can_access(campaign, current_user.id)
            )
        )
    ]
    return official + custom


@router.get("/all", response_model=list[ItemTemplateResponse])
async def list_all_item_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    official = [official_template_response(template_id, template) for template_id, template in ITEM_TEMPLATES.items()]
    custom = [
        custom_template_response(template)
        for template in db.query(ItemTemplate).filter(ItemTemplate.owner_id == current_user.id).order_by(ItemTemplate.name).all()
        if template.campaign_id is None
        or template.owner_id == current_user.id
        or (
            (campaign := db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first())
            and user_can_access(campaign, current_user.id)
        )
    ]
    return official + custom


@router.post("/", response_model=ItemTemplateResponse)
async def create_item_template(
    item_data: ItemTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    values = item_data.model_dump()
    values = clean_item_statistics(values)
    validate_item_statistics(values)
    campaign_id = values.get("campaign_id")
    if campaign_id is not None:
        campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        require_campaign_access(campaign, current_user.id)
    require_character_scope(values.get("character_id"), campaign_id, current_user, db)

    template = ItemTemplate(
        **{key: value for key, value in values.items() if key != "requires_attunement"},
        source="custom",
        owner_id=current_user.id,
        requires_attunement="true" if values.get("requires_attunement") else "false",
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return custom_template_response(template)


@router.put("/{template_id}", response_model=ItemTemplateResponse)
async def update_item_template(
    template_id: str,
    item_data: ItemTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = require_custom_template(template_id, db)
    if not can_manage_template(template, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item template access denied")
    values = item_data.model_dump(exclude_unset=True)
    merged_values = {**custom_template_response(template), **values}
    cleaned_values = clean_item_statistics(merged_values)
    validate_item_statistics(cleaned_values)
    if "damage" in values:
        values["damage"] = cleaned_values["damage"]
    if "type" in values or "armor_class" in values:
        values["armor_class"] = cleaned_values["armor_class"]
    if "campaign_id" in values and values["campaign_id"] is not None:
        campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == values["campaign_id"]).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        require_campaign_access(campaign, current_user.id)
    if "character_id" in values:
        require_character_scope(values["character_id"], values.get("campaign_id", template.campaign_id), current_user, db)
    for field, value in values.items():
        if field == "requires_attunement":
            setattr(template, field, "true" if value else "false")
        else:
            setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return custom_template_response(template)


@router.delete("/{template_id}")
async def delete_item_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = require_custom_template(template_id, db)
    if not can_manage_template(template, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item template access denied")
    db.delete(template)
    db.commit()
    return {"message": "Item template deleted successfully"}
