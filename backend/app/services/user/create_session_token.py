from app.services.user._core import *


def create_session_token(user_id: int) -> str:
    expires_at = int(time.time()) + SESSION_EXPIRE_SECONDS
    payload = f"{user_id}:{expires_at}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = f"{payload}:{signature}"
    return base64.urlsafe_b64encode(token.encode()).decode()
