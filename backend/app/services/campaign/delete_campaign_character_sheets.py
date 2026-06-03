from app.services.campaign._core import *


def delete_campaign_character_sheets(campaign_id: int, db: Session):
    for model in (Dnd5e2014CharacterSheet, Tormenta20CharacterSheet):
        db.query(model).filter(model.campaign_id == campaign_id).delete(synchronize_session=False)
