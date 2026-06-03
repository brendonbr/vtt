from app.services.item_template._core import *


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
