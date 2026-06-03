from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Tormenta20CharacterSheet(Base):
    __tablename__ = "tormenta20_character_sheets"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("adventure_campaigns.id"), nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String, nullable=False, index=True)
    player_name = Column(String, default="")
    race = Column(String, default="")
    origin = Column(String, default="")
    class_name = Column(String, default="")
    level = Column(Integer, default=1, nullable=False)
    deity = Column(String, default="")
    size = Column(String, default="Medio")
    experience_points = Column(Integer, default=0, nullable=False)

    strength = Column(Integer, default=0, nullable=False)
    dexterity = Column(Integer, default=0, nullable=False)
    constitution = Column(Integer, default=0, nullable=False)
    intelligence = Column(Integer, default=0, nullable=False)
    wisdom = Column(Integer, default=0, nullable=False)
    charisma = Column(Integer, default=0, nullable=False)

    defense = Column(Integer, default=10, nullable=False)
    armor_bonus = Column(Integer, default=0, nullable=False)
    shield_bonus = Column(Integer, default=0, nullable=False)
    other_defense_bonus = Column(Integer, default=0, nullable=False)
    damage_reduction = Column(Integer, default=0, nullable=False)
    initiative = Column(Integer, default=0, nullable=False)
    speed = Column(Integer, default=9, nullable=False)

    max_hit_points = Column(Integer, default=1, nullable=False)
    current_hit_points = Column(Integer, default=1, nullable=False)
    temporary_hit_points = Column(Integer, default=0, nullable=False)
    max_mana_points = Column(Integer, default=0, nullable=False)
    current_mana_points = Column(Integer, default=0, nullable=False)

    skill_training = Column(JSON, default=list, nullable=False)
    skills = Column(JSON, default=dict, nullable=False)
    attacks = Column(JSON, default=list, nullable=False)
    powers = Column(JSON, default=list, nullable=False)
    spells = Column(JSON, default=dict, nullable=False)
    equipment = Column(JSON, default=list, nullable=False)
    currency = Column(JSON, default=dict, nullable=False)

    proficiencies = Column(Text, default="")
    languages = Column(Text, default="")
    class_features = Column(Text, default="")
    race_features = Column(Text, default="")
    origin_feature = Column(Text, default="")
    deity_obligations = Column(Text, default="")
    backstory = Column(Text, default="")
    notes = Column(Text, default="")
    conditions = Column(JSON, default=list, nullable=False)
    avatar = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campaign = relationship("AdventureCampaign", back_populates="tormenta20_character_sheets")
    owner = relationship("User")
