from app.services.campaign._core import *


def campaign_media_dir(campaign_id: int) -> str:
    return os.path.join(CAMPAIGN_MEDIA_ROOT, str(campaign_id))
