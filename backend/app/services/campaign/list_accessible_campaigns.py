from app.services.campaign._core import *


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
