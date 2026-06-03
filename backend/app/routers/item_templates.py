from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.user import User
from app.routers.users import get_current_user, get_db
from app.schemas.item_template import ItemTemplateCreate, ItemTemplateResponse, ItemTemplateUpdate
from app.services import item_template_service

router = APIRouter(prefix="/api/item-templates", tags=["item-templates"])


@router.get("/", response_model=list[ItemTemplateResponse])
async def list_item_templates(
    campaign_id: Optional[int] = Query(default=None),
    character_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return item_template_service.list_item_templates(campaign_id, character_id, current_user, db)


@router.get("/all", response_model=list[ItemTemplateResponse])
async def list_all_item_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return item_template_service.list_all_item_templates(current_user, db)


@router.post("/", response_model=ItemTemplateResponse)
async def create_item_template(
    item_data: ItemTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return item_template_service.create_item_template(item_data, current_user, db)


@router.put("/{template_id}", response_model=ItemTemplateResponse)
async def update_item_template(
    template_id: str,
    item_data: ItemTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return item_template_service.update_item_template(template_id, item_data, current_user, db)


@router.delete("/{template_id}")
async def delete_item_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return item_template_service.delete_item_template(template_id, current_user, db)
