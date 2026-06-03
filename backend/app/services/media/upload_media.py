from app.services.media._core import *


def upload_media(campaign_id: int, file: UploadFile, current_user: User, db: Session) -> MediaItem:
    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    ensure_campaign_media_dir(campaign_id)
    filename = unique_media_filename(campaign_id, sanitize_media_filename(file.filename))
    file_path = os.path.join(campaign_uploaded_media_dir(campaign_id), filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return build_media_item(campaign_id, filename)
