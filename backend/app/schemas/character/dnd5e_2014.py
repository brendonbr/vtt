from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class Dnd5e2014CharacterSheetBase(BaseModel):
    campaign_id: Optional[int] = None
    name: str
    player_name: str = ""
    race: str = ""
    class_name: str = ""
    subclass: str = ""
    level: int = 1
    background: str = ""
    alignment: str = ""
    experience_points: int = 0
    inspiration: bool = False
    proficiency_bonus: int = 2
    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10
    saving_throw_proficiencies: list[str] = Field(default_factory=list)
    skill_proficiencies: list[str] = Field(default_factory=list)
    skill_expertise: list[str] = Field(default_factory=list)
    armor_class: int = 10
    initiative: int = 0
    speed: int = 30
    max_hit_points: int = 1
    current_hit_points: int = 1
    temporary_hit_points: int = 0
    hit_dice_total: str = ""
    hit_dice_current: str = ""
    death_save_successes: int = 0
    death_save_failures: int = 0
    attacks: list[dict[str, Any]] = Field(default_factory=list)
    equipment: list[dict[str, Any]] = Field(default_factory=list)
    currency: dict[str, int] = Field(default_factory=dict)
    features_traits: list[dict[str, Any]] = Field(default_factory=list)
    proficiencies_languages: str = ""
    spellcasting_class: str = ""
    spellcasting_ability: str = ""
    spell_save_dc: int = 0
    spell_attack_bonus: int = 0
    spells: dict[str, Any] = Field(default_factory=dict)
    personality_traits: str = ""
    ideals: str = ""
    bonds: str = ""
    flaws: str = ""
    backstory: str = ""
    allies_organizations: str = ""
    treasure: str = ""
    notes: str = ""
    conditions: list[str] = Field(default_factory=list)
    avatar: Optional[str] = None
    sheet_data: dict[str, Any] = Field(default_factory=dict)


class Dnd5e2014CharacterSheetCreate(Dnd5e2014CharacterSheetBase):
    pass


class Dnd5e2014CharacterSheetUpdate(BaseModel):
    campaign_id: Optional[int] = None
    name: Optional[str] = None
    player_name: Optional[str] = None
    race: Optional[str] = None
    class_name: Optional[str] = None
    subclass: Optional[str] = None
    level: Optional[int] = None
    background: Optional[str] = None
    alignment: Optional[str] = None
    experience_points: Optional[int] = None
    inspiration: Optional[bool] = None
    proficiency_bonus: Optional[int] = None
    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None
    saving_throw_proficiencies: Optional[list[str]] = None
    skill_proficiencies: Optional[list[str]] = None
    skill_expertise: Optional[list[str]] = None
    armor_class: Optional[int] = None
    initiative: Optional[int] = None
    speed: Optional[int] = None
    max_hit_points: Optional[int] = None
    current_hit_points: Optional[int] = None
    temporary_hit_points: Optional[int] = None
    hit_dice_total: Optional[str] = None
    hit_dice_current: Optional[str] = None
    death_save_successes: Optional[int] = None
    death_save_failures: Optional[int] = None
    attacks: Optional[list[dict[str, Any]]] = None
    equipment: Optional[list[dict[str, Any]]] = None
    currency: Optional[dict[str, int]] = None
    features_traits: Optional[list[dict[str, Any]]] = None
    proficiencies_languages: Optional[str] = None
    spellcasting_class: Optional[str] = None
    spellcasting_ability: Optional[str] = None
    spell_save_dc: Optional[int] = None
    spell_attack_bonus: Optional[int] = None
    spells: Optional[dict[str, Any]] = None
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None
    backstory: Optional[str] = None
    allies_organizations: Optional[str] = None
    treasure: Optional[str] = None
    notes: Optional[str] = None
    conditions: Optional[list[str]] = None
    avatar: Optional[str] = None
    sheet_data: Optional[dict[str, Any]] = None


class Dnd5e2014CharacterSheetResponse(Dnd5e2014CharacterSheetBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
