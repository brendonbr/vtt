from app.services.campaign._core import *


def create_campaign(campaign_data: AdventureCampaignCreate, current_user: User, db: Session) -> AdventureCampaign:
    campaign = AdventureCampaign(**campaign_data.model_dump(exclude={"owner_id"}), owner_id=current_user.id)
    db.add(campaign)
    db.flush()
    ensure_campaign_media_dir(campaign.id)
    db.add(CampaignParticipant(campaign_id=campaign.id, user_id=current_user.id, role="dm"))
    db.commit()
    db.refresh(campaign)
    return campaign
