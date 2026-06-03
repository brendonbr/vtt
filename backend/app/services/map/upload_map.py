from app.services.map._core import *


def upload_map(campaign_id: int, file: UploadFile, current_user: User, db: Session) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    campaign = get_campaign_or_404(campaign_id, db)
    require_dm(campaign, current_user.id)
    filename = sanitize_filename(file.filename)
    ensure_campaign_media_dir(campaign_id)

    file_path = os.path.join(campaign_maps_dir(campaign_id), filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Map uploaded successfully", "filename": filename}
