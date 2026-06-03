from app.services.media._core import *


def build_media_item(campaign_id: int, filename: str) -> MediaItem:
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return MediaItem(
        id=filename,
        filename=filename,
        name=filename,
        type=media_type,
        kind=media_kind(media_type),
        url=f"/api/campaigns/{campaign_id}/media/{filename}",
    )
