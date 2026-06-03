from app.services.campaign._core import *


def delete_campaign(campaign_id: int, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    delete_campaign_character_sheets(campaign_id, db)
    db.delete(campaign)
    db.commit()
    delete_campaign_media_dir(campaign_id)
    return {"message": "Campaign deleted successfully"}
