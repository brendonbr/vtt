from app.services.media._core import *


def delete_media(campaign_id: int, filename: str, current_user: User, db: Session) -> dict[str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    clean_name = sanitize_media_filename(filename)
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    os.remove(file_path)
    return {"message": "Media deleted successfully"}
