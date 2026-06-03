from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.campaign import DEFAULT_GAME_SYSTEM, SUPPORTED_GAME_SYSTEMS, normalize_game_system


class AdventureCampaignBase(BaseModel):
    name: str
    description: str = ""
    game_system: str = DEFAULT_GAME_SYSTEM
    status: str = "draft"
    owner_id: Optional[int] = None
    active_map: Optional[str] = None
    thumbnail: Optional[str] = None
    setting: str = ""
    party_notes: str = ""
    gm_notes: str = ""

    @field_validator("game_system")
    @classmethod
    def validate_game_system(cls, value: str) -> str:
        value = normalize_game_system(value)
        if value not in SUPPORTED_GAME_SYSTEMS:
            raise ValueError(f"Game system must be one of: {', '.join(SUPPORTED_GAME_SYSTEMS)}")
        return value


class AdventureCampaignCreate(AdventureCampaignBase):
    pass


class AdventureCampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    game_system: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None
    active_map: Optional[str] = None
    thumbnail: Optional[str] = None
    setting: Optional[str] = None
    party_notes: Optional[str] = None
    gm_notes: Optional[str] = None

    @field_validator("game_system")
    @classmethod
    def validate_game_system(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            value = normalize_game_system(value)
        if value is not None and value not in SUPPORTED_GAME_SYSTEMS:
            raise ValueError(f"Game system must be one of: {', '.join(SUPPORTED_GAME_SYSTEMS)}")
        return value


class AdventureCampaignResponse(AdventureCampaignBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignParticipantCreate(BaseModel):
    user_id: int
    role: str = "player"
    status: str = "active"


class CampaignParticipantResponse(BaseModel):
    id: int
    campaign_id: int
    user_id: int
    role: str
    status: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdventureCampaignDetailResponse(AdventureCampaignResponse):
    participants: list[CampaignParticipantResponse] = []
