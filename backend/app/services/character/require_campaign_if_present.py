from app.services.character._core import *


def require_campaign_if_present(campaign_id: Optional[int], user_id: int, db: Session):
    if campaign_id is None:
        return None
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, user_id)
    return campaign
