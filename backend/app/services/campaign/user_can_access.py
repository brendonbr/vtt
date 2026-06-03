from app.services.campaign._core import *


def user_can_access(campaign: AdventureCampaign, user_id: int) -> bool:
    if campaign.owner_id == user_id:
        return True
    return any(participant.user_id == user_id and participant.status == "active" for participant in campaign.participants)
