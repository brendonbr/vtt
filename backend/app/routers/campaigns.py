import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.campaign import (
    AdventureCampaign,
    AdventureCampaignCreate,
    AdventureCampaignDetailResponse,
    AdventureCampaignResponse,
    AdventureCampaignUpdate,
    CampaignParticipant,
    CampaignParticipantCreate,
    CampaignParticipantResponse,
)
from app.models.character import Dnd5e2014CharacterSheet, Tormenta20CharacterSheet
from app.models.user import User
from app.routers.users import get_current_user, get_db

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CAMPAIGN_MEDIA_ROOT = os.path.join(BACKEND_DIR, "campaings")
ALLOWED_THUMBNAIL_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}


def campaign_media_dir(campaign_id: int) -> str:
    return os.path.join(CAMPAIGN_MEDIA_ROOT, str(campaign_id))


def ensure_campaign_media_dir(campaign_id: int):
    base_dir = campaign_media_dir(campaign_id)
    for folder in ("maps", "media", "tokens", "handouts", "audio", "thumbnails"):
        os.makedirs(os.path.join(base_dir, folder), exist_ok=True)


def delete_campaign_media_dir(campaign_id: int):
    shutil.rmtree(campaign_media_dir(campaign_id), ignore_errors=True)


def campaign_thumbnail_dir(campaign_id: int) -> str:
    return os.path.join(campaign_media_dir(campaign_id), "thumbnails")


def sanitize_thumbnail_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    if not clean_name or clean_name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    file_ext = os.path.splitext(clean_name)[1].lower()
    if file_ext not in ALLOWED_THUMBNAIL_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only images allowed.")
    return clean_name


def get_campaign_or_404(campaign_id: int, db: Session) -> AdventureCampaign:
    campaign = db.query(AdventureCampaign).filter(AdventureCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


def user_can_access(campaign: AdventureCampaign, user_id: int) -> bool:
    if campaign.owner_id == user_id:
        return True
    return any(participant.user_id == user_id and participant.status == "active" for participant in campaign.participants)


def require_campaign_access(campaign: AdventureCampaign, user_id: int):
    if not user_can_access(campaign, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Campaign access denied")


def require_dm(campaign: AdventureCampaign, user_id: int):
    if campaign.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the campaign DM can do this")


def delete_campaign_character_sheets(campaign_id: int, db: Session):
    for model in (Dnd5e2014CharacterSheet, Tormenta20CharacterSheet):
        db.query(model).filter(model.campaign_id == campaign_id).delete(synchronize_session=False)


@router.post("/", response_model=AdventureCampaignDetailResponse)
async def create_campaign(
    campaign_data: AdventureCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = AdventureCampaign(**campaign_data.model_dump(exclude={"owner_id"}), owner_id=current_user.id)
    db.add(campaign)
    db.flush()
    ensure_campaign_media_dir(campaign.id)
    db.add(CampaignParticipant(campaign_id=campaign.id, user_id=current_user.id, role="dm"))
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/", response_model=list[AdventureCampaignResponse])
async def list_accessible_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaigns = (
        db.query(AdventureCampaign)
        .outerjoin(CampaignParticipant)
        .filter(
            or_(
                AdventureCampaign.owner_id == current_user.id,
                CampaignParticipant.user_id == current_user.id,
            )
        )
        .distinct()
        .all()
    )
    return campaigns


@router.get("/{campaign_id}", response_model=AdventureCampaignDetailResponse)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    return campaign


@router.post("/{campaign_id}/join", response_model=CampaignParticipantResponse)
async def join_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    existing = (
        db.query(CampaignParticipant)
        .filter(
            CampaignParticipant.campaign_id == campaign.id,
            CampaignParticipant.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        existing.status = "active"
        existing.role = "player" if existing.role != "dm" else "dm"
        db.commit()
        db.refresh(existing)
        return existing

    participant = CampaignParticipant(campaign_id=campaign.id, user_id=current_user.id, role="player")
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.post("/{campaign_id}/players", response_model=CampaignParticipantResponse)
async def add_player_to_campaign(
    campaign_id: int,
    participant_data: CampaignParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)

    user = db.query(User).filter(User.id == participant_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Player user not found")

    existing = (
        db.query(CampaignParticipant)
        .filter(
            CampaignParticipant.campaign_id == campaign.id,
            CampaignParticipant.user_id == participant_data.user_id,
        )
        .first()
    )
    if existing:
        existing.role = participant_data.role
        existing.status = participant_data.status
        db.commit()
        db.refresh(existing)
        return existing

    participant = CampaignParticipant(campaign_id=campaign.id, **participant_data.model_dump())
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.put("/{campaign_id}", response_model=AdventureCampaignDetailResponse)
async def update_campaign(
    campaign_id: int,
    campaign_data: AdventureCampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)

    updates = campaign_data.model_dump(exclude_unset=True, exclude={"owner_id"})
    for field, value in updates.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/thumbnail", response_model=AdventureCampaignDetailResponse)
async def upload_campaign_thumbnail(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    filename = sanitize_thumbnail_filename(file.filename)
    ensure_campaign_media_dir(campaign_id)

    thumbnail_dir = campaign_thumbnail_dir(campaign_id)
    for existing in os.listdir(thumbnail_dir):
        existing_path = os.path.join(thumbnail_dir, existing)
        if os.path.isfile(existing_path):
            os.remove(existing_path)

    file_path = os.path.join(thumbnail_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    campaign.thumbnail = f"/api/campaigns/{campaign_id}/thumbnail/{filename}"
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/thumbnail/{filename}")
async def get_campaign_thumbnail(
    campaign_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    clean_name = sanitize_thumbnail_filename(filename)
    file_path = os.path.join(campaign_thumbnail_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thumbnail not found")
    return FileResponse(file_path, media_type="image/*", filename=clean_name)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    delete_campaign_character_sheets(campaign_id, db)
    db.delete(campaign)
    db.commit()
    delete_campaign_media_dir(campaign_id)
    return {"message": "Campaign deleted successfully"}
