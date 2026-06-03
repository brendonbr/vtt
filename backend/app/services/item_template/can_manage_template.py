from app.services.item_template._core import *


def can_manage_template(template: ItemTemplate, user: User, db: Session) -> bool:
    if template.owner_id == user.id:
        return True
    if template.campaign_id is None:
        return False
    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == template.campaign_id).first()
    return bool(campaign and campaign.owner_id == user.id)
