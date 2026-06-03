from app.services.campaign._core import *


def delete_campaign_media_dir(campaign_id: int):
    shutil.rmtree(campaign_media_dir(campaign_id), ignore_errors=True)
