from app.services.campaign._core import *


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
