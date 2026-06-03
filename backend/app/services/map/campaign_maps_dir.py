from app.services.map._core import *


def campaign_maps_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "maps")
