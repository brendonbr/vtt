import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.users import get_current_user, get_db
from app.schemas.campaign import (
    AdventureCampaignCreate,
    AdventureCampaignDetailResponse,
    AdventureCampaignResponse,
    AdventureCampaignUpdate,
    CampaignParticipantCreate,
    CampaignParticipantResponse,
)
from app.services import campaign_service

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.post("/", response_model=AdventureCampaignDetailResponse)
async def create_campaign(
    campaign_data: AdventureCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.create_campaign(campaign_data, current_user, db)


@router.get("/", response_model=list[AdventureCampaignResponse])
async def list_accessible_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.list_accessible_campaigns(current_user, db)


@router.get("/{campaign_id}", response_model=AdventureCampaignDetailResponse)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.get_campaign_for_user(campaign_id, current_user, db)


@router.post("/{campaign_id}/join", response_model=CampaignParticipantResponse)
async def join_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.join_campaign(campaign_id, current_user, db)


@router.post("/{campaign_id}/players", response_model=CampaignParticipantResponse)
async def add_player_to_campaign(
    campaign_id: int,
    participant_data: CampaignParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.add_player_to_campaign(campaign_id, participant_data, current_user, db)


@router.put("/{campaign_id}", response_model=AdventureCampaignDetailResponse)
async def update_campaign(
    campaign_id: int,
    campaign_data: AdventureCampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.update_campaign(campaign_id, campaign_data, current_user, db)


@router.post("/{campaign_id}/thumbnail", response_model=AdventureCampaignDetailResponse)
async def upload_campaign_thumbnail(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    campaign, filename = campaign_service.set_campaign_thumbnail(campaign_id, file.filename, current_user, db)

    thumbnail_dir = campaign_service.campaign_thumbnail_dir(campaign_id)
    for existing in os.listdir(thumbnail_dir):
        existing_path = os.path.join(thumbnail_dir, existing)
        if os.path.isfile(existing_path):
            os.remove(existing_path)

    file_path = os.path.join(thumbnail_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return campaign_service.save_campaign_thumbnail_path(campaign, campaign_id, filename, db)


@router.get("/{campaign_id}/thumbnail/{filename}")
async def get_campaign_thumbnail(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = campaign_service.get_campaign_for_user(campaign_id, current_user, db)
    clean_name = campaign_service.sanitize_thumbnail_filename(filename)
    file_path = os.path.join(campaign_service.campaign_thumbnail_dir(campaign.id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thumbnail not found")
    return FileResponse(file_path, media_type="image/*", filename=clean_name)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return campaign_service.delete_campaign(campaign_id, current_user, db)
