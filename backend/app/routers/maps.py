from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.users import get_current_user, get_db
from app.services import map_service
from app.services.map.service import MapItem

router = APIRouter(prefix="/api/campaigns/{campaign_id}/maps", tags=["maps"])


@router.post("/upload")
async def upload_map(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a map image file into this campaign's maps folder."""
    return map_service.upload_map(campaign_id, file, current_user, db)


@router.get("/")
async def list_maps(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MapItem]:
    """List this campaign's uploaded map images."""
    return map_service.list_maps(campaign_id, current_user, db)


@router.get("/{filename}")
async def get_map(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific map image file from this campaign."""
    file_path, clean_name = map_service.get_map_path(campaign_id, filename, current_user, db)
    return FileResponse(file_path, media_type="image/*", filename=clean_name)


@router.delete("/{filename}")
async def delete_map(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific campaign map image."""
    return map_service.delete_map(campaign_id, filename, current_user, db)


@router.put("/{filename}")
async def update_map(
    campaign_id: int,
    filename: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace a campaign map image with a new file."""
    return map_service.update_map(campaign_id, filename, file, current_user, db)
