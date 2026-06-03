from app.services.item_template._core import *


def update_item_template(template_id: str, item_data: ItemTemplateUpdate, current_user: User, db: Session) -> dict[str, Any]:
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
