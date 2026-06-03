from app.services.user._core import *


def verify_session_token(token: str) -> Optional[int]:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        user_id_str, expires_at_str, signature = raw.split(":")
        payload = f"{user_id_str}:{expires_at_str}"
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(expected, signature):
            return None
        if int(expires_at_str) < int(time.time()):
            return None
        return int(user_id_str)
    except Exception:
        return None
