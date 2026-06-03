from app.services.campaign._core import *


def campaign_thumbnail_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "thumbnails")
