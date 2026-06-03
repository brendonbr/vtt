from app.services.item_template._core import *


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
