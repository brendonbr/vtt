from app.services.item_template._core import *


def delete_item_template(template_id: str, current_user: User, db: Session) -> dict[str, str]:
    template = require_custom_template(template_id, db)
    if not can_manage_template(template, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item template access denied")
    db.delete(template)
    db.commit()
    return {"message": "Item template deleted successfully"}
