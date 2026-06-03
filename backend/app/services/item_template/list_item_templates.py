from app.services.item_template._core import *


def list_item_templates(campaign_id: Optional[int], character_id: Optional[int], current_user: User, db: Session) -> list[dict[str, Any]]:
    if campaign_id is not None:
        campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        require_campaign_access(campaign, current_user.id)
    require_character_scope(character_id, campaign_id, current_user, db)

    official = [official_template_response(template_id, template) for template_id, template in ITEM_TEMPLATES.items()]
    filters = [ItemTemplate.owner_id == current_user.id]
    if campaign_id is not None:
        filters.append(ItemTemplate.campaign_id == campaign_id)
    custom_query = db.query(ItemTemplate).filter(or_(*filters))
    custom = [
        custom_template_response(template)
        for template in custom_query.order_by(ItemTemplate.name).all()
        if template.character_id == character_id
        and (
            template.campaign_id is None
            or template.owner_id == current_user.id
            or (
                (campaign := db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first())
                and user_can_access(campaign, current_user.id)
            )
        )
    ]
    return official + custom
