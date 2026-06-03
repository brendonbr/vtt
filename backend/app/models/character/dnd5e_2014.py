from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Dnd5e2014CharacterSheet(Base):
    __tablename__ = "dnd5e_2014_character_sheets"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("adventure_campaigns.id"), nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String, nullable=False, index=True)
    player_name = Column(String, default="")
    race = Column(String, default="")
    class_name = Column(String, default="")
    subclass = Column(String, default="")
    level = Column(Integer, default=1, nullable=False)
    background = Column(String, default="")
    alignment = Column(String, default="")
    experience_points = Column(Integer, default=0, nullable=False)
    inspiration = Column(Boolean, default=False, nullable=False)
    proficiency_bonus = Column(Integer, default=2, nullable=False)

    strength = Column(Integer, default=10, nullable=False)
    dexterity = Column(Integer, default=10, nullable=False)
    constitution = Column(Integer, default=10, nullable=False)
    intelligence = Column(Integer, default=10, nullable=False)
    wisdom = Column(Integer, default=10, nullable=False)
    charisma = Column(Integer, default=10, nullable=False)

    saving_throw_proficiencies = Column(JSON, default=list, nullable=False)
    skill_proficiencies = Column(JSON, default=list, nullable=False)
    skill_expertise = Column(JSON, default=list, nullable=False)

    armor_class = Column(Integer, default=10, nullable=False)
    initiative = Column(Integer, default=0, nullable=False)
    speed = Column(Integer, default=30, nullable=False)
    max_hit_points = Column(Integer, default=1, nullable=False)
    current_hit_points = Column(Integer, default=1, nullable=False)
    temporary_hit_points = Column(Integer, default=0, nullable=False)
    hit_dice_total = Column(String, default="")
    hit_dice_current = Column(String, default="")
    death_save_successes = Column(Integer, default=0, nullable=False)
    death_save_failures = Column(Integer, default=0, nullable=False)

    attacks = Column(JSON, default=list, nullable=False)
    equipment = Column(JSON, default=list, nullable=False)
    currency = Column(JSON, default=dict, nullable=False)
    features_traits = Column(JSON, default=list, nullable=False)
    proficiencies_languages = Column(Text, default="")

    spellcasting_class = Column(String, default="")
    spellcasting_ability = Column(String, default="")
    spell_save_dc = Column(Integer, default=0, nullable=False)
    spell_attack_bonus = Column(Integer, default=0, nullable=False)
    spells = Column(JSON, default=dict, nullable=False)

    personality_traits = Column(Text, default="")
    ideals = Column(Text, default="")
    bonds = Column(Text, default="")
    flaws = Column(Text, default="")
    backstory = Column(Text, default="")
    allies_organizations = Column(Text, default="")
    treasure = Column(Text, default="")
    notes = Column(Text, default="")
    conditions = Column(JSON, default=list, nullable=False)
    avatar = Column(String, nullable=True)
    sheet_data = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campaign = relationship("AdventureCampaign", back_populates="dnd5e_2014_character_sheets")
    owner = relationship("User")
