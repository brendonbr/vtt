from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.users import get_current_user, get_db
from app.services import media_service
from app.services.media.service import MediaItem

router = APIRouter(prefix="/api/campaigns/{campaign_id}/media", tags=["media"])


@router.post("/upload", response_model=MediaItem)
async def upload_media(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return media_service.upload_media(campaign_id, file, current_user, db)


@router.get("/", response_model=List[MediaItem])
async def list_media(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return media_service.list_media(campaign_id, current_user, db)


@router.get("/{filename}")
async def get_media(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_path, clean_name, media_type = media_service.get_media_path(campaign_id, filename, current_user, db)
    return FileResponse(file_path, media_type=media_type, filename=clean_name)


@router.delete("/{filename}")
async def delete_media(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return media_service.delete_media(campaign_id, filename, current_user, db)
