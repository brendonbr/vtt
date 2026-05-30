from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
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


class ItemTemplateBase(BaseModel):
    campaign_id: Optional[int] = None
    character_id: Optional[int] = None
    name: str
    type: str
    description: str = ""
    rarity: str = "Common"
    weight: float = 0
    cost: str = ""
    image: str = ""
    requires_attunement: bool = False
    damage: dict[str, Any] = Field(default_factory=dict)
    armor_class: dict[str, Any] = Field(default_factory=dict)
    properties: list[str] = Field(default_factory=list)
    modifiers: list[dict[str, Any]] = Field(default_factory=list)
    effects: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Item name is required")
        return value.strip()

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in ITEM_TYPES:
            raise ValueError("Invalid item type")
        return value

    @field_validator("rarity")
    @classmethod
    def validate_rarity(cls, value: str) -> str:
        if value not in RARITIES:
            raise ValueError("Invalid rarity")
        return value

    @field_validator("weight")
    @classmethod
    def validate_weight(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Weight cannot be negative")
        return value


class ItemTemplateCreate(ItemTemplateBase):
    pass


class ItemTemplateUpdate(BaseModel):
    campaign_id: Optional[int] = None
    character_id: Optional[int] = None
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    rarity: Optional[str] = None
    weight: Optional[float] = None
    cost: Optional[str] = None
    image: Optional[str] = None
    requires_attunement: Optional[bool] = None
    damage: Optional[dict[str, Any]] = None
    armor_class: Optional[dict[str, Any]] = None
    properties: Optional[list[str]] = None
    modifiers: Optional[list[dict[str, Any]]] = None
    effects: Optional[list[str]] = None


class ItemTemplateResponse(ItemTemplateBase):
    id: str
    source: Literal["official", "custom"]
    owner_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
