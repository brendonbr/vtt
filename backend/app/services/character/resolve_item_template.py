from app.services.character._core import *


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
