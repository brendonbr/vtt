import mimetypes
import os
import shutil
from typing import List

from fastapi import HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.campaign.service import (
    campaign_media_dir,
    ensure_campaign_media_dir,
    get_campaign_or_404,
    require_campaign_access,
    require_dm,
)

ALLOWED_MEDIA_EXTENSIONS = {
    ".gif",
    ".jpeg",
    ".jpg",
    ".mp3",
    ".mp4",
    ".ogg",
    ".pdf",
    ".png",
    ".wav",
    ".webm",
    ".webp",
}


class MediaItem(BaseModel):
    id: str
    filename: str
    name: str
    type: str
    kind: str
    url: str


def campaign_uploaded_media_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "media")


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


def sanitize_media_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    if not clean_name or clean_name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    file_ext = os.path.splitext(clean_name)[1].lower()
    if file_ext not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media file type")
    return clean_name


def unique_media_filename(campaign_id: int, filename: str) -> str:
    media_dir = campaign_uploaded_media_dir(campaign_id)
    name, ext = os.path.splitext(filename)
    candidate = filename
    counter = 1
    while os.path.exists(os.path.join(media_dir, candidate)):
        candidate = f"{name}-{counter}{ext}"
        counter += 1
    return candidate


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


def upload_media(campaign_id: int, file: UploadFile, current_user: User, db: Session) -> MediaItem:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    ensure_campaign_media_dir(campaign_id)
    filename = unique_media_filename(campaign_id, sanitize_media_filename(file.filename))
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return build_media_item(campaign_id, filename)


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


def get_media_path(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[str, str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    clean_name = sanitize_media_filename(filename)
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    media_type = mimetypes.guess_type(clean_name)[0] or "application/octet-stream"
    return file_path, clean_name, media_type


def delete_media(campaign_id: int, filename: str, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_media_filename(filename)
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    os.remove(file_path)
    return {"message": "Media deleted successfully"}
