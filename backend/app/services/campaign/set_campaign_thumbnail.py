from app.services.campaign._core import *


def set_campaign_thumbnail(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[AdventureCampaign, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_thumbnail_filename(filename)
    ensure_campaign_media_dir(campaign_id)
    return campaign, clean_name
