from app.services.media._core import *


def list_media(campaign_id: int, current_user: User, db: Session) -> List[MediaItem]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    media_dir = campaign_uploaded_media_dir(campaign_id)
    if not os.path.exists(media_dir):
        return []
    return [
        build_media_item(campaign_id, filename)
        for filename in sorted(os.listdir(media_dir))
        if os.path.isfile(os.path.join(media_dir, filename))
    ]
