from app.services.map._core import *


def get_map_path(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[str, str]:
    require_map_access(campaign_id, current_user, db)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")
    return file_path, clean_name
