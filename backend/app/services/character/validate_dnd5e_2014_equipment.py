from app.services.character._core import *


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
