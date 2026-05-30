ITEM_TEMPLATES = {
    "longsword": {"type": "weapon", "slot": "mainHand", "attunement": False},
    "longsword-plus-one": {"type": "weapon", "slot": "mainHand", "attunement": False},
    "shortbow": {"type": "weapon", "slot": "mainHand", "attunement": False, "properties": ["two-handed", "ammunition"]},
    "arrows": {"type": "ammunition", "slot": "ammunition", "attunement": False},
    "leather-armor": {"type": "armor", "slot": "armor", "attunement": False},
    "chain-mail": {"type": "armor", "slot": "armor", "attunement": False, "strengthRequirement": 13},
    "plate-armor": {"type": "armor", "slot": "armor", "attunement": False, "strengthRequirement": 15},
    "shield": {"type": "shield", "slot": "shield", "attunement": False},
    "ring-of-protection": {"type": "accessory", "slot": "ring1", "attunement": True},
    "boots-of-speed": {"type": "accessory", "slot": "boots", "attunement": True},
    "potion-of-healing": {"type": "consumable", "slot": "consumable", "attunement": False},
}

EXCLUSIVE_SLOTS = {
    "mainHand",
    "offHand",
    "armor",
    "shield",
    "helmet",
    "gloves",
    "boots",
    "cloak",
    "ring1",
    "ring2",
    "amulet",
    "belt",
}
