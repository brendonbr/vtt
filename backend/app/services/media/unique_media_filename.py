from app.services.media._core import *


def unique_media_filename(campaign_id: int, filename: str) -> str:
    media_dir = campaign_uploaded_media_dir(campaign_id)
    name, ext = os.path.splitext(filename)
    candidate = filename
    counter = 1
    while os.path.exists(os.path.join(media_dir, candidate)):
        candidate = f"{name}-{counter}{ext}"
        counter += 1
    return candidate
