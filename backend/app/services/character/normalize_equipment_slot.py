from app.services.character._core import *


def normalize_equipment_slot(slot: Optional[str]) -> Optional[str]:
    if slot in LEGACY_WEAPON_SLOTS:
        return "weapon"
    if slot in LEGACY_GEAR_SLOTS:
        return "gear"
    return slot
