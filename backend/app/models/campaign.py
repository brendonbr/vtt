from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

SUPPORTED_GAME_SYSTEMS = ("Dnd5e 2014", "Tormenta20")
DEFAULT_GAME_SYSTEM = SUPPORTED_GAME_SYSTEMS[0]


class AdventureCampaign(Base):
    __tablename__ = "adventure_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, default="")
    game_system = Column(String, default=DEFAULT_GAME_SYSTEM)
    status = Column(String, default="draft", index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    active_map = Column(String, nullable=True)
    thumbnail = Column(String, nullable=True)
    setting = Column(Text, default="")
    party_notes = Column(Text, default="")
    gm_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User")
    participants = relationship(
        "CampaignParticipant",
        cascade="all, delete-orphan",
        back_populates="campaign",
    )
    dnd5e_2014_character_sheets = relationship(
        "Dnd5e2014CharacterSheet",
        cascade="all, delete-orphan",
        back_populates="campaign",
    )
    tormenta20_character_sheets = relationship(
        "Tormenta20CharacterSheet",
        cascade="all, delete-orphan",
        back_populates="campaign",
    )


class CampaignParticipant(Base):
    __tablename__ = "campaign_participants"
    __table_args__ = (UniqueConstraint("campaign_id", "user_id", name="uq_campaign_participant"),)

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("adventure_campaigns.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, default="player", nullable=False)
    status = Column(String, default="active", nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("AdventureCampaign", back_populates="participants")
    user = relationship("User")


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
