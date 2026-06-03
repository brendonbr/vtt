from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

SUPPORTED_GAME_SYSTEMS = ("Dnd5e 2014", "Tormenta20", "Naruto RPG")
DEFAULT_GAME_SYSTEM = SUPPORTED_GAME_SYSTEMS[0]
GAME_SYSTEM_ALIASES = {
    "D&D 5e": "Dnd5e 2014",
    "D&D 5e (2014)": "Dnd5e 2014",
    "dnd5e2014": "Dnd5e 2014",
    "tormenta20": "Tormenta20",
    "naruto": "Naruto RPG",
}


def normalize_game_system(value: str) -> str:
    return GAME_SYSTEM_ALIASES.get(value, value)


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
