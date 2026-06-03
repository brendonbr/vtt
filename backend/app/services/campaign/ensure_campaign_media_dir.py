from app.services.campaign._core import *


def ensure_campaign_media_dir(campaign_id: int):
    base_dir = campaign_media_dir(campaign_id)
    for folder in ("maps", "media", "tokens", "handouts", "audio", "thumbnails"):
        os.makedirs(os.path.join(base_dir, folder), exist_ok=True)
