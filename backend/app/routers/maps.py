from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
import os
import shutil
from typing import List
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.campaigns import (
    campaign_media_dir,
    ensure_campaign_media_dir,
    get_campaign_or_404,
    require_campaign_access,
    require_dm,
)
from app.routers.users import get_current_user, get_db

router = APIRouter(prefix="/api/campaigns/{campaign_id}/maps", tags=["maps"])

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


@router.post("/upload")
async def upload_map(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a map image file into this campaign's maps folder."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    filename = sanitize_filename(file.filename)
    ensure_campaign_media_dir(campaign_id)

    file_path = os.path.join(campaign_maps_dir(campaign_id), filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Map uploaded successfully", "filename": filename}

@router.get("/")
async def list_maps(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MapItem]:
    """List this campaign's uploaded map images."""
    require_map_access(campaign_id, current_user, db)
    maps_dir = campaign_maps_dir(campaign_id)
    if not os.path.exists(maps_dir):
        return []

    maps = []
    for filename in os.listdir(maps_dir):
        if os.path.isfile(os.path.join(maps_dir, filename)):
            maps.append(MapItem(id=filename, filename=filename))
    return maps

@router.get("/{filename}")
async def get_map(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific map image file from this campaign."""
    require_map_access(campaign_id, current_user, db)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Map not found")

    return FileResponse(file_path, media_type="image/*", filename=clean_name)

@router.delete("/{filename}")
async def delete_map(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific campaign map image."""
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Map not found")

    os.remove(file_path)
    return {"message": "Map deleted successfully"}

@router.put("/{filename}")
async def update_map(
    campaign_id: int,
    filename: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace a campaign map image with a new file."""
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Map not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    sanitize_filename(file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Map updated successfully"}
