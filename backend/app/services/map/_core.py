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

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}


class MapItem(BaseModel):
    id: str
    filename: str


def campaign_maps_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "maps")


def sanitize_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    if not clean_name or clean_name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    file_ext = os.path.splitext(clean_name)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only images allowed.")
    return clean_name


def require_map_access(campaign_id: int, current_user: User, db: Session):
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    return campaign


def upload_map(campaign_id: int, file: UploadFile, current_user: User, db: Session) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    filename = sanitize_filename(file.filename)
    ensure_campaign_media_dir(campaign_id)

    file_path = os.path.join(campaign_maps_dir(campaign_id), filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Map uploaded successfully", "filename": filename}


def list_maps(campaign_id: int, current_user: User, db: Session) -> List[MapItem]:
    require_map_access(campaign_id, current_user, db)
    maps_dir = campaign_maps_dir(campaign_id)
    if not os.path.exists(maps_dir):
        return []

    maps = []
    for filename in os.listdir(maps_dir):
        if os.path.isfile(os.path.join(maps_dir, filename)):
            maps.append(MapItem(id=filename, filename=filename))
    return maps


def get_map_path(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[str, str]:
    require_map_access(campaign_id, current_user, db)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")
    return file_path, clean_name


def delete_map(campaign_id: int, filename: str, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")

    os.remove(file_path)
    return {"message": "Map deleted successfully"}


def update_map(campaign_id: int, filename: str, file: UploadFile, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")
    sanitize_filename(file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Map updated successfully"}
