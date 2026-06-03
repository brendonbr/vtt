from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.users import get_current_user, get_db
from app.schemas.character import Dnd5e2014CharacterSheetResponse, Tormenta20CharacterSheetResponse
from app.services import character_service

router = APIRouter(prefix="/api/characters", tags=["characters"])

CharacterResponse = Dnd5e2014CharacterSheetResponse | Tormenta20CharacterSheetResponse


@router.post("/", response_model=CharacterResponse)
async def create_character_sheet(
    character_data: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return character_service.create_character_sheet(character_data, current_user, db)


@router.get("/", response_model=list[CharacterResponse])
async def list_character_sheets(
    campaign_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return character_service.list_character_sheets(campaign_id, current_user, db)


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character_sheet(
    character_id: int,
    campaign_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return character_service.get_character_sheet(character_id, campaign_id, current_user, db)


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character_sheet(
    character_id: int,
    character_data: dict[str, Any],
    campaign_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return character_service.update_character_sheet(character_id, character_data, campaign_id, current_user, db)


@router.delete("/{character_id}")
async def delete_character_sheet(
    character_id: int,
    campaign_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return character_service.delete_character_sheet(character_id, campaign_id, current_user, db)
