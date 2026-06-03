from app.services.campaign._core import *


def get_campaign_or_404(campaign_id: int, db: Session) -> AdventureCampaign:
    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign
