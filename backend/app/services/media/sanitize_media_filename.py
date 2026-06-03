from app.services.media._core import *


def sanitize_media_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    if not clean_name or clean_name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    file_ext = os.path.splitext(clean_name)[1].lower()
    if file_ext not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media file type")
    return clean_name
