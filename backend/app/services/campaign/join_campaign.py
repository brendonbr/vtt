from app.services.campaign._core import *


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
