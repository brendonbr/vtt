from app.services.item_template._core import *


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
