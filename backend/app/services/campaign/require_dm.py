from app.services.campaign._core import *


def require_dm(campaign: AdventureCampaign, user_id: int):
    if campaign.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the campaign DM can do this")
