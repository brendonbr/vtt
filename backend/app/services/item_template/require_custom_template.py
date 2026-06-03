from app.services.item_template._core import *


def require_custom_template(template_id: str, db: Session) -> ItemTemplate:
    if not template_id.startswith("custom-"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only custom items can be modified")
    try:
        numeric_id = int(template_id.removeprefix("custom-"))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item template not found") from error
    template = db.query(ItemTemplate).filter(ItemTemplate.id == numeric_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item template not found")
    return template
