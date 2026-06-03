from app.services.map._core import *


def delete_map(campaign_id: int, filename: str, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_filename(filename)
    file_path = os.path.join(campaign_maps_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")

    os.remove(file_path)
    return {"message": "Map deleted successfully"}
