from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class Tormenta20CharacterSheetBase(BaseModel):
    campaign_id: Optional[int] = None
    name: str
    player_name: str = ""
    race: str = ""
    origin: str = ""
    class_name: str = ""
    level: int = 1
    deity: str = ""
    size: str = "Medio"
    experience_points: int = 0
    strength: int = 0
    dexterity: int = 0
    constitution: int = 0
    intelligence: int = 0
    wisdom: int = 0
    charisma: int = 0
    defense: int = 10
    armor_bonus: int = 0
    shield_bonus: int = 0
    other_defense_bonus: int = 0
    damage_reduction: int = 0
    initiative: int = 0
    speed: int = 9
    max_hit_points: int = 1
    current_hit_points: int = 1
    temporary_hit_points: int = 0
    max_mana_points: int = 0
    current_mana_points: int = 0
    skill_training: list[str] = Field(default_factory=list)
    skills: dict[str, int] = Field(default_factory=dict)
    attacks: list[dict[str, Any]] = Field(default_factory=list)
    powers: list[dict[str, Any]] = Field(default_factory=list)
    spells: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    equipment: list[dict[str, Any]] = Field(default_factory=list)
    currency: dict[str, int] = Field(default_factory=dict)
    proficiencies: str = ""
    languages: str = ""
    class_features: str = ""
    race_features: str = ""
    origin_feature: str = ""
    deity_obligations: str = ""
    backstory: str = ""
    notes: str = ""
    conditions: list[str] = Field(default_factory=list)
    avatar: Optional[str] = None


class Tormenta20CharacterSheetCreate(Tormenta20CharacterSheetBase):
    pass


class Tormenta20CharacterSheetUpdate(BaseModel):
    campaign_id: Optional[int] = None
    name: Optional[str] = None
    player_name: Optional[str] = None
    race: Optional[str] = None
    origin: Optional[str] = None
    class_name: Optional[str] = None
    level: Optional[int] = None
    deity: Optional[str] = None
    size: Optional[str] = None
    experience_points: Optional[int] = None
    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None
    defense: Optional[int] = None
    armor_bonus: Optional[int] = None
    shield_bonus: Optional[int] = None
    other_defense_bonus: Optional[int] = None
    damage_reduction: Optional[int] = None
    initiative: Optional[int] = None
    speed: Optional[int] = None
    max_hit_points: Optional[int] = None
    current_hit_points: Optional[int] = None
    temporary_hit_points: Optional[int] = None
    max_mana_points: Optional[int] = None
    current_mana_points: Optional[int] = None
    skill_training: Optional[list[str]] = None
    skills: Optional[dict[str, int]] = None
    attacks: Optional[list[dict[str, Any]]] = None
    powers: Optional[list[dict[str, Any]]] = None
    spells: Optional[dict[str, list[dict[str, Any]]]] = None
    equipment: Optional[list[dict[str, Any]]] = None
    currency: Optional[dict[str, int]] = None
    proficiencies: Optional[str] = None
    languages: Optional[str] = None
    class_features: Optional[str] = None
    race_features: Optional[str] = None
    origin_feature: Optional[str] = None
    deity_obligations: Optional[str] = None
    backstory: Optional[str] = None
    notes: Optional[str] = None
    conditions: Optional[list[str]] = None
    avatar: Optional[str] = None


class Tormenta20CharacterSheetResponse(Tormenta20CharacterSheetBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
