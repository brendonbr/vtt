from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.item_template import ITEM_TYPES, RARITIES


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
