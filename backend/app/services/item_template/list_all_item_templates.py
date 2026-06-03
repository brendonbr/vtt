from app.services.item_template._core import *


def list_all_item_templates(current_user: User, db: Session) -> list[dict[str, Any]]:
    official = [official_template_response(template_id, template) for template_id, template in ITEM_TEMPLATES.items()]
    custom = [
        custom_template_response(template)
        for template in db.query(ItemTemplate).filter(ItemTemplate.owner_id == current_user.id).order_by(ItemTemplate.name).all()
        if template.campaign_id is None
        or template.owner_id == current_user.id
        or (
            (campaign := db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first())
            and user_can_access(campaign, current_user.id)
        )
    ]
    return official + custom
