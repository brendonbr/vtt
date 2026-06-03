from app.services.campaign._core import *


def update_campaign(
    campaign_id: int,
    campaign_data: AdventureCampaignUpdate,
    current_user: User,
    db: Session,
) -> AdventureCampaign:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)

    updates = campaign_data.model_dump(exclude_unset=True, exclude={"owner_id"})
    for field, value in updates.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return campaign
