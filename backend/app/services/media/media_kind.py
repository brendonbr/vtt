from app.services.media._core import *


def media_kind(media_type: str) -> str:
    if media_type.startswith("image/"):
        return "image"
    if media_type.startswith("video/"):
        return "video"
    if media_type.startswith("audio/"):
        return "audio"
    if media_type == "application/pdf":
        return "pdf"
    return "file"
