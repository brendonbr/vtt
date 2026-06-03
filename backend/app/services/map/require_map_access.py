from app.services.map._core import *


def require_map_access(campaign_id: int, current_user: User, db: Session):
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    return campaign
