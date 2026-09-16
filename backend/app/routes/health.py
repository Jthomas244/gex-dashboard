from datetime import datetime, timedelta, timezone

from fastapi import APIRouter
from ..config import get_settings

router = APIRouter()

REFRESH_TOKEN_LIFETIME = timedelta(days=7)  # Schwab's fixed limit
EXPIRING_SOON = timedelta(days=2)


def _token_status(issued_at: str) -> dict:
    """Describe where the Schwab refresh token is in its 7-day life."""
    if not issued_at:
        return {"state": "unknown", "issued_at": None, "expires_at": None, "days_remaining": None}
    try:
        issued = datetime.fromisoformat(issued_at)
    except ValueError:
        return {"state": "unknown", "issued_at": issued_at, "expires_at": None, "days_remaining": None}
    if issued.tzinfo is None:
        issued = issued.replace(tzinfo=timezone.utc)
    expires = issued + REFRESH_TOKEN_LIFETIME
    remaining = expires - datetime.now(timezone.utc)
    if remaining <= timedelta(0):
        state = "expired"
    elif remaining <= EXPIRING_SOON:
        state = "expiring"
    else:
        state = "ok"
    return {
        "state": state,
        "issued_at": issued.isoformat(timespec="seconds"),
        "expires_at": expires.isoformat(timespec="seconds"),
        "days_remaining": round(max(remaining.total_seconds(), 0) / 86400, 1),
    }


@router.get("/api/health")
async def health_check():
    settings = get_settings()
    body = {"status": "ok", "data_source": settings.data_source}
    if settings.data_source == "schwab":
        body["schwab_token"] = _token_status(settings.schwab_token_issued_at)
    return body
