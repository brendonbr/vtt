from app.services.campaign._core import *


def save_campaign_thumbnail_path(campaign: AdventureCampaign, campaign_id: int, filename: str, db: Session) -> AdventureCampaign:
    campaign.thumbnail = f"/api/campaigns/{campaign_id}/thumbnail/{filename}"
    db.commit()
    db.refresh(campaign)
    return campaign
