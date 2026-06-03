import os
import shutil

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.campaign import AdventureCampaign, CampaignParticipant
from app.models.character import Dnd5e2014CharacterSheet, Tormenta20CharacterSheet
from app.models.user import User
from app.schemas.campaign import AdventureCampaignCreate, AdventureCampaignUpdate, CampaignParticipantCreate

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
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


def create_campaign(campaign_data: AdventureCampaignCreate, current_user: User, db: Session) -> AdventureCampaign:
    campaign = AdventureCampaign(**campaign_data.model_dump(exclude={"owner_id"}), owner_id=current_user.id)
    db.add(campaign)
    db.flush()
    ensure_campaign_media_dir(campaign.id)
    db.add(CampaignParticipant(campaign_id=campaign.id, user_id=current_user.id, role="dm"))
    db.commit()
    db.refresh(campaign)
    return campaign


def list_accessible_campaigns(current_user: User, db: Session) -> list[AdventureCampaign]:
    return (
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


def get_campaign_for_user(campaign_id: int, current_user: User, db: Session) -> AdventureCampaign:
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    return campaign


def join_campaign(campaign_id: int, current_user: User, db: Session) -> CampaignParticipant:
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


def add_player_to_campaign(
    campaign_id: int,
    participant_data: CampaignParticipantCreate,
    current_user: User,
    db: Session,
) -> CampaignParticipant:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)

    user = db.query(User).filter(User.id == participant_data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player user not found")

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


def update_campaign(
    campaign_id: int,
    campaign_data: AdventureCampaignUpdate,
    current_user: User,
    db: Session,
) -> AdventureCampaign:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)

    updates = campaign_data.model_dump(exclude_unset=True, exclude={"owner_id"})
    for field, value in updates.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return campaign


def set_campaign_thumbnail(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[AdventureCampaign, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_thumbnail_filename(filename)
    ensure_campaign_media_dir(campaign_id)
    return campaign, clean_name


def save_campaign_thumbnail_path(campaign: AdventureCampaign, campaign_id: int, filename: str, db: Session) -> AdventureCampaign:
    campaign.thumbnail = f"/api/campaigns/{campaign_id}/thumbnail/{filename}"
    db.commit()
    db.refresh(campaign)
    return campaign


def delete_campaign(campaign_id: int, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    delete_campaign_character_sheets(campaign_id, db)
    db.delete(campaign)
    db.commit()
    delete_campaign_media_dir(campaign_id)
    return {"message": "Campaign deleted successfully"}
