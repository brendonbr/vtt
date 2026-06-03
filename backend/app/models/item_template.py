from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base

ITEM_TYPES = {"weapon", "armor", "shield", "gear", "magic", "magicalItem", "accessory", "consumable", "ammunition"}
RARITIES = {"Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unknown"}
DAMAGE_TYPES = {
    "",
    "Acid",
    "Bludgeoning",
    "Cold",
    "Fire",
    "Force",
    "Lightning",
    "Necrotic",
    "Piercing",
    "Poison",
    "Psychic",
    "Radiant",
    "Slashing",
    "Thunder",
}
EQUIPMENT_SLOTS = {
    "weapon",
    "mainHand",
    "offHand",
    "armor",
    "shield",
    "helmet",
    "gloves",
    "boots",
    "cloak",
    "ring1",
    "ring2",
    "amulet",
    "belt",
    "gear",
    "ammunition",
    "consumable",
}


class ItemTemplate(Base):
    __tablename__ = "item_templates"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, default="custom", nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("adventure_campaigns.id"), nullable=True, index=True)
    character_id = Column(Integer, ForeignKey("dnd5e_2014_character_sheets.id"), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    description = Column(Text, default="")
    rarity = Column(String, default="Common")
    weight = Column(Float, default=0)
    cost = Column(String, default="")
    image = Column(Text, default="")
    requires_attunement = Column(String, default="false")
    damage = Column(JSON, default=dict, nullable=False)
    armor_class = Column(JSON, default=dict, nullable=False)
    properties = Column(JSON, default=list, nullable=False)
    modifiers = Column(JSON, default=list, nullable=False)
    effects = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User")
    campaign = relationship("AdventureCampaign")
