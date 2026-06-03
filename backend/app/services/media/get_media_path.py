from app.services.media._core import *


def get_media_path(campaign_id: int, filename: str, current_user: User, db: Session) -> tuple[str, str, str]:
    campaign = get_campaign_or_404(campaign_id, db)
    require_campaign_access(campaign, current_user.id)
    clean_name = sanitize_media_filename(filename)
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    media_type = mimetypes.guess_type(clean_name)[0] or "application/octet-stream"
    return file_path, clean_name, media_type
