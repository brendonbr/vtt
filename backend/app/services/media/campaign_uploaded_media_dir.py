from app.services.media._core import *


def campaign_uploaded_media_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "media")
