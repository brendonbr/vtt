from app.services.item_template._core import *


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
