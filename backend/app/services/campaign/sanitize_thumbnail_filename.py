from app.services.campaign._core import *


def sanitize_thumbnail_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    if not clean_name or clean_name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    file_ext = os.path.splitext(clean_name)[1].lower()
    if file_ext not in ALLOWED_THUMBNAIL_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only images allowed.")
    return clean_name
