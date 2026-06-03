from app.services.campaign._core import *


def require_campaign_access(campaign: AdventureCampaign, user_id: int):
    if not user_can_access(campaign, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Campaign access denied")
