from app.services.campaign._core import *


def get_campaign_for_user(campaign_id: int, current_user: User, db: Session) -> AdventureCampaign:
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    return campaign
