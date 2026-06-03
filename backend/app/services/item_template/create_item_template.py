from app.services.item_template._core import *


def create_item_template(item_data: ItemTemplateCreate, current_user: User, db: Session) -> dict[str, Any]:
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
